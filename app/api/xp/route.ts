import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { STRIPE_XP, type Belt } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, amount, reason } = await req.json()
  if (!student_id || amount === undefined || !reason) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .single()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const event_type = amount >= 0 ? 'manual_award' : 'manual_deduct'
  const newTotalXP = Math.max(0, student.total_xp + amount)
  const newStripeXP = Math.max(0, student.current_stripe_xp + amount)

  const currentBelt: Belt = student.belt as Belt
  const stripeThreshold = STRIPE_XP[currentBelt]
  const stripeEligible = stripeThreshold > 0 && newStripeXP >= stripeThreshold && student.belt_stripes < 4

  await supabase.from('xp_events').insert({
    student_id,
    amount,
    reason,
    event_type,
  })

  await supabase.from('students').update({
    total_xp: newTotalXP,
    current_stripe_xp: newStripeXP,
    stripe_eligible: stripeEligible,
  }).eq('id', student_id)

  return NextResponse.json({ ok: true, new_total_xp: newTotalXP })
}

export async function GET(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get('student_id')
  if (!student_id) return NextResponse.json({ error: 'Missing student_id' }, { status: 400 })

  const { data } = await supabase
    .from('xp_events')
    .select('*')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}
