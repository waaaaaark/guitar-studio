import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const BUCKET = 'student-files'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const EXPIRY_DAYS = 14

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: files, error } = await supabase
    .from('student_files')
    .select('*')
    .eq('student_id', id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = await Promise.all((files || []).map(async (f) => {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(f.file_path, 3600)
    return { ...f, url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json(withUrls)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const displayName = (formData.get('display_name') as string | null)?.trim() || null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${id}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, await file.arrayBuffer(), {
      contentType: file.type || 'application/octet-stream',
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

  const { data, error: dbError } = await supabase
    .from('student_files')
    .insert({
      student_id: id,
      file_name: displayName || file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([filePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { file_id } = await req.json()

  const { data: file } = await supabase
    .from('student_files')
    .select('file_path')
    .eq('id', file_id)
    .eq('student_id', id)
    .single()

  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.storage.from(BUCKET).remove([file.file_path])
  await supabase.from('student_files').delete().eq('id', file_id)

  return NextResponse.json({ ok: true })
}
