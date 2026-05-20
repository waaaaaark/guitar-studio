import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const resource_type = formData.get('resource_type') as string
  const tags = JSON.parse(formData.get('tags') as string || '[]')

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
  }

  // Generate a unique path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${timestamp}_${safeName}`

  // Upload to Supabase storage
  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('resources')
    .upload(filePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('resources')
    .getPublicUrl(filePath)

  // Save resource record
  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      resource_type: resource_type || 'Other',
      source_type: 'upload',
      url: urlData.publicUrl,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      tags,
    })
    .select()
    .single()

  if (error) {
    // Clean up storage if DB insert fails
    await supabase.storage.from('resources').remove([filePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
