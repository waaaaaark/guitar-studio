import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'resources'

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
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `uploads/${timestamp}_${safeName}`

  // Upload to Supabase storage
  const buffer = await file.arrayBuffer()
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({
      error: `Upload failed: ${uploadError.message}. Make sure the "${BUCKET}" bucket exists in Supabase Storage and is set to public.`
    }, { status: 500 })
  }

  // Build public URL — works with both old and new Supabase URL formats
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  // Strip trailing slash
  const baseUrl = supabaseUrl.replace(/\/$/, '')
  // Supabase storage public URL format
  const publicUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${filePath}`

  // Also try the SDK method as backup
  const { data: sdkUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  const finalUrl = sdkUrlData?.publicUrl || publicUrl

  // Save resource record
  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      resource_type: resource_type || 'Other',
      source_type: 'upload',
      url: finalUrl,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      tags,
    })
    .select()
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([filePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
