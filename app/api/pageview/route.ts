import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ ok: false })

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('token', token)
    .eq('active', true)
    .single()

  if (!student) return NextResponse.json({ ok: false })

  const userAgent = req.headers.get('user-agent') || null

  await supabase.from('page_views').insert({
    student_id: student.id,
    user_agent: userAgent,
  })

  return NextResponse.json({ ok: true })
}
