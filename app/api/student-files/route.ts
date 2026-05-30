import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('token', token)
    .single()

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: files } = await supabase
    .from('student_files')
    .select('id, file_name, file_size, file_type, file_path, created_at')
    .eq('student_id', student.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const withUrls = await Promise.all((files || []).map(async (f) => {
    const { data: signed } = await supabase.storage
      .from('student-files')
      .createSignedUrl(f.file_path, 3600)
    const { file_path: _, ...rest } = f
    return { ...rest, url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json(withUrls)
}
