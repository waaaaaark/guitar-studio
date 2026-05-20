import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { BELT_ORDER, type Belt } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, belt, stripes } = await req.json()

  if (!student_id || !belt || stripes === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!BELT_ORDER.includes(belt as Belt)) {
    return NextResponse.json({ error: 'Invalid belt' }, { status: 400 })
  }

  const stripesNum = Math.max(0, Math.min(4, parseInt(stripes)))

  // Black belt can't have stripes in BJJ
  const finalStripes = belt === 'Black' ? 0 : stripesNum

  await supabase.from('students').update({
    belt,
    belt_stripes: finalStripes,
    // Reset eligibility flags since we're placing manually
    stripe_eligible: false,
    belt_eligible: false,
    current_stripe_xp: 0,
  }).eq('id', student_id)

  // Log it so there's a record
  await supabase.from('xp_events').insert({
    student_id,
    amount: 0,
    reason: `Belt placed at ${belt} Belt, ${finalStripes} stripe${finalStripes !== 1 ? 's' : ''} (manual placement)`,
    event_type: 'belt_earn',
  })

  return NextResponse.json({ ok: true, belt, stripes: finalStripes })
}
