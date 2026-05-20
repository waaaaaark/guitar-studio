import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - fetch requirements for a belt level, with student completion status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const belt = searchParams.get('belt')
  const student_id = searchParams.get('student_id')
  const token = searchParams.get('token') // for student-facing page

  // Resolve student_id from token if needed
  let resolvedStudentId = student_id
  if (!resolvedStudentId && token) {
    const { data: student } = await supabase
      .from('students')
      .select('id, belt, belt_stripes')
      .eq('token', token)
      .single()
    if (student) resolvedStudentId = student.id
  }

  if (!belt) return NextResponse.json({ error: 'Missing belt' }, { status: 400 })

  // Get all requirements for this belt
  const { data: requirements } = await supabase
    .from('belt_requirements')
    .select('*')
    .eq('belt', belt)
    .order('stripe')
    .order('sort_order')

  if (!resolvedStudentId) return NextResponse.json(requirements || [])

  // Get this student's completions
  const { data: completions } = await supabase
    .from('student_requirements')
    .select('*')
    .eq('student_id', resolvedStudentId)

  const completionMap: Record<string, any> = {}
  for (const c of completions || []) {
    completionMap[c.requirement_id] = c
  }

  const merged = (requirements || []).map(r => ({
    ...r,
    completed: completionMap[r.id]?.completed || false,
    completed_at: completionMap[r.id]?.completed_at || null,
    note: completionMap[r.id]?.note || null,
    completion_id: completionMap[r.id]?.id || null,
  }))

  return NextResponse.json(merged)
}

// POST - toggle a requirement completion (admin only)
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, requirement_id, completed, note } = await req.json()
  if (!student_id || !requirement_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('student_requirements')
    .upsert({
      student_id,
      requirement_id,
      completed,
      completed_at: completed ? today : null,
      note: note || null,
    }, { onConflict: 'student_id,requirement_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // After toggling, check if all requirements for current stripe are complete
  // If so, and XP threshold also met, mark stripe_eligible
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .single()

  if (student) {
    const currentStripe = student.belt_stripes + 1 // next stripe they're working toward
    
    // Get all requirements for current stripe
    const { data: stripeReqs } = await supabase
      .from('belt_requirements')
      .select('id')
      .eq('belt', student.belt)
      .eq('stripe', currentStripe)

    if (stripeReqs && stripeReqs.length > 0) {
      // Check completions
      const { data: completions } = await supabase
        .from('student_requirements')
        .select('requirement_id, completed')
        .eq('student_id', student_id)
        .eq('completed', true)
        .in('requirement_id', stripeReqs.map(r => r.id))

      const allReqsMet = completions && completions.length === stripeReqs.length

      // Import STRIPE_XP
      const { STRIPE_XP } = await import('@/lib/supabase')
      const stripeThreshold = STRIPE_XP[student.belt as keyof typeof STRIPE_XP] || 0
      const xpMet = student.current_stripe_xp >= stripeThreshold

      const stripeEligible = !!(allReqsMet && xpMet && student.belt_stripes < 4)

      await supabase.from('students')
        .update({ stripe_eligible: stripeEligible })
        .eq('id', student_id)
    }
  }

  return NextResponse.json(data)
}
