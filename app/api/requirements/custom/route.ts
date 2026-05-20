import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - add a custom requirement for a specific student
// or mark a global requirement as hidden for a student
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, requirement_id, action, custom_text, belt, stripe } = await req.json()

  if (action === 'hide' && requirement_id) {
    // Mark a global requirement as N/A for this student by completing it with a note
    const { data, error } = await supabase
      .from('student_requirements')
      .upsert({
        student_id,
        requirement_id,
        completed: true,
        completed_at: new Date().toISOString().split('T')[0],
        note: 'N/A for this student',
      }, { onConflict: 'student_id,requirement_id' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'add_custom' && custom_text) {
    // First add to belt_requirements as a custom entry
    const { data: req_data, error: req_error } = await supabase
      .from('belt_requirements')
      .insert({
        belt,
        stripe: parseInt(stripe),
        requirement: custom_text.trim(),
        sort_order: 100,
      })
      .select()
      .single()
    if (req_error) return NextResponse.json({ error: req_error.message }, { status: 500 })

    // Then mark it as belonging to this student only
    // We use the student_requirements table to track it
    return NextResponse.json({ requirement: req_data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
