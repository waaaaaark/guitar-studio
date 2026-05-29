import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  // Accept either admin session or a valid student token (for future student-facing use)
  if (token) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('token', token)
      .eq('active', true)
      .single()
    if (!student) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } else {
    const authed = await checkAdminAuth()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [eventsRes, studentsRes] = await Promise.all([
    supabase
      .from('xp_events')
      .select('student_id, amount')
      .gte('created_at', weekAgo.toISOString()),
    supabase
      .from('students')
      .select('id, name, belt')
      .eq('active', true)
      .not('name', 'like', '%__test__%'),
  ])

  const xpByStudent: Record<string, number> = {}
  for (const event of eventsRes.data || []) {
    xpByStudent[event.student_id] = (xpByStudent[event.student_id] || 0) + event.amount
  }

  const leaderboard = (studentsRes.data || [])
    .map(s => ({ ...s, weekly_xp: xpByStudent[s.id] || 0 }))
    .filter(s => s.weekly_xp > 0)
    .sort((a, b) => b.weekly_xp - a.weekly_xp)

  return NextResponse.json(leaderboard)
}
