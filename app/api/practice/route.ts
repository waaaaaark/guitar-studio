import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  XP_PER_MINUTE, DAILY_MINUTE_CAP, MAX_SESSION_MINUTES,
  FLAG_SESSION_MINUTES, STRIPE_XP, BELT_ORDER, type Belt
} from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { token, duration_minutes } = await req.json()

  if (!token || !duration_minutes) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Validate duration
  const minutes = Math.min(Math.round(duration_minutes), MAX_SESSION_MINUTES)
  if (minutes < 1) return NextResponse.json({ error: 'Session too short' }, { status: 400 })

  // Get student by token
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('token', token)
    .eq('active', true)
    .single()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  // Check daily cap
  const { data: cap } = await supabase
    .from('daily_xp_caps')
    .select('minutes_logged')
    .eq('student_id', student.id)
    .eq('cap_date', today)
    .single()

  const minutesLogged = cap?.minutes_logged || 0
  const minutesAllowed = Math.max(0, DAILY_MINUTE_CAP - minutesLogged)
  const billableMinutes = Math.min(minutes, minutesAllowed)
  const xpEarned = billableMinutes * XP_PER_MINUTE
  const flagged = minutes >= FLAG_SESSION_MINUTES

  // Upsert daily cap
  await supabase.from('daily_xp_caps').upsert({
    student_id: student.id,
    cap_date: today,
    minutes_logged: minutesLogged + minutes,
  }, { onConflict: 'student_id,cap_date' })

  // Insert practice session
  await supabase.from('practice_sessions').insert({
    student_id: student.id,
    session_date: today,
    duration_minutes: minutes,
    xp_earned: xpEarned,
    flagged,
  })

  // Log XP event
  if (xpEarned > 0) {
    await supabase.from('xp_events').insert({
      student_id: student.id,
      amount: xpEarned,
      reason: `${minutes} min practice session`,
      event_type: 'practice',
    })
  }

  // Update streak
  const lastDate = student.last_practice_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = student.current_streak
  if (lastDate === today) {
    // Already practiced today, no streak change
  } else if (lastDate === yesterdayStr) {
    newStreak = student.current_streak + 1
  } else {
    newStreak = 1 // reset
  }
  const newLongest = Math.max(student.longest_streak, newStreak)

  // Calculate new XP and stripe eligibility
  const newTotalXP = student.total_xp + xpEarned
  const newStripeXP = student.current_stripe_xp + xpEarned
  const currentBelt: Belt = student.belt as Belt
  const stripeThreshold = STRIPE_XP[currentBelt]
  const stripeEligible = stripeThreshold > 0 && newStripeXP >= stripeThreshold && student.belt_stripes < 4

  await supabase.from('students').update({
    total_xp: newTotalXP,
    current_stripe_xp: newStripeXP,
    stripe_eligible: stripeEligible || student.stripe_eligible,
    total_practice_minutes: student.total_practice_minutes + minutes,
    current_streak: newStreak,
    longest_streak: newLongest,
    last_practice_date: today,
  }).eq('id', student.id)

  return NextResponse.json({
    ok: true,
    xp_earned: xpEarned,
    minutes_logged: minutes,
    billable_minutes: billableMinutes,
    capped: billableMinutes < minutes,
    flagged,
    new_total_xp: newTotalXP,
    stripe_eligible: stripeEligible,
    new_streak: newStreak,
  })
}

export async function PATCH(req: NextRequest) {
  const { token, goal_minutes_week } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('token', token)
    .eq('active', true)
    .single()

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('students')
    .update({ practice_goal_minutes_week: goal_minutes_week ?? null })
    .eq('id', student.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('token', token)
    .single()

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: sessions } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json(sessions || [])
}
