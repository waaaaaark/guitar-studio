import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { BELT_ORDER, type Belt } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, action } = await req.json()
  // action: 'award_stripe' | 'award_belt'

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .single()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const currentBelt: Belt = student.belt as Belt
  const beltIndex = BELT_ORDER.indexOf(currentBelt)

  if (action === 'award_stripe') {
    if (student.belt_stripes >= 4) {
      return NextResponse.json({ error: 'Already at 4 stripes — award belt instead' }, { status: 400 })
    }
    const newStripes = student.belt_stripes + 1
    const beltEligible = newStripes >= 4 && beltIndex < BELT_ORDER.length - 1

    await supabase.from('students').update({
      belt_stripes: newStripes,
      stripe_eligible: false,
      current_stripe_xp: 0, // reset stripe XP after award
      belt_eligible: beltEligible,
    }).eq('id', student_id)

    await supabase.from('xp_events').insert({
      student_id,
      amount: 0,
      reason: `Stripe ${newStripes} awarded on ${currentBelt} belt`,
      event_type: 'stripe_earn',
    })

    return NextResponse.json({ ok: true, new_stripes: newStripes, belt_eligible: beltEligible })
  }

  if (action === 'award_belt') {
    if (beltIndex >= BELT_ORDER.length - 1) {
      return NextResponse.json({ error: 'Already at Black Belt' }, { status: 400 })
    }
    const newBelt = BELT_ORDER[beltIndex + 1]

    await supabase.from('students').update({
      belt: newBelt,
      belt_stripes: 0,
      stripe_eligible: false,
      belt_eligible: false,
      current_stripe_xp: 0,
    }).eq('id', student_id)

    await supabase.from('xp_events').insert({
      student_id,
      amount: 0,
      reason: `Promoted to ${newBelt} Belt`,
      event_type: 'belt_earn',
    })

    return NextResponse.json({ ok: true, new_belt: newBelt })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
