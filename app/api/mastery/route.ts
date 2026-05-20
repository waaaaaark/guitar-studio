import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { SONG_MASTERY_XP, STRIPE_XP, type Belt } from '@/lib/supabase'

// Student marks a song as "working on it"
export async function PUT(req: NextRequest) {
  const { token, song_id } = await req.json()
  if (!token || !song_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('token', token)
    .single()

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('student_songs').upsert({
    student_id: student.id,
    song_id,
    mastery_status: 'eligible',
    first_worked_on: new Date().toISOString().split('T')[0],
  }, { onConflict: 'student_id,song_id' })

  return NextResponse.json({ ok: true })
}

// Admin approves mastery and awards XP
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, song_id } = await req.json()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .single()

  const { data: song } = await supabase
    .from('songs')
    .select('title')
    .eq('id', song_id)
    .single()

  if (!student || !song) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  // Mark as mastered
  await supabase.from('student_songs').update({
    mastery_status: 'mastered',
    mastered_at: today,
  }).eq('student_id', student_id).eq('song_id', song_id)

  // Award XP
  const newTotalXP = student.total_xp + SONG_MASTERY_XP
  const newStripeXP = student.current_stripe_xp + SONG_MASTERY_XP
  const currentBelt: Belt = student.belt as Belt
  const stripeThreshold = STRIPE_XP[currentBelt]
  const stripeEligible = stripeThreshold > 0 && newStripeXP >= stripeThreshold && student.belt_stripes < 4

  await supabase.from('students').update({
    total_xp: newTotalXP,
    current_stripe_xp: newStripeXP,
    stripe_eligible: stripeEligible || student.stripe_eligible,
  }).eq('id', student_id)

  await supabase.from('xp_events').insert({
    student_id,
    amount: SONG_MASTERY_XP,
    reason: `Mastered: ${song.title}`,
    event_type: 'song_mastery',
  })

  return NextResponse.json({ ok: true, xp_awarded: SONG_MASTERY_XP })
}
