import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [studentsRes, pendingRes] = await Promise.all([
    supabase.from('students').select('*').order('name'),
    supabase
      .from('student_songs')
      .select('student_id')
      .eq('mastery_status', 'eligible'),
  ])

  if (studentsRes.error) return NextResponse.json({ error: studentsRes.error.message }, { status: 500 })

  // Count pending per student
  const pendingCounts: Record<string, number> = {}
  for (const row of pendingRes.data || []) {
    pendingCounts[row.student_id] = (pendingCounts[row.student_id] || 0) + 1
  }

  const students = (studentsRes.data || []).map(s => ({
    ...s,
    pending_mastery: pendingCounts[s.id] || 0,
  }))

  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('students')
    .insert({
      name: body.name,
      email: body.email || null,
      skill_level: body.skill_level || 'Beginner',
      lesson_frequency: body.lesson_frequency || 'Weekly',
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      admin_notes: body.admin_notes || null,
      student_profile: body.student_profile || 'Teen',
      belt_system_active: body.belt_system_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
