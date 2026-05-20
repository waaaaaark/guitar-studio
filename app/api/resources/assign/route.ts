import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - resources assigned to a specific student (admin)
export async function GET(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get('student_id')
  if (!student_id) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

  const { data } = await supabase
    .from('student_resources')
    .select(`*, resource:resources(*)`)
    .eq('student_id', student_id)
    .order('assigned_at', { ascending: false })

  return NextResponse.json(data || [])
}

// POST - assign a resource to a student
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, resource_id, note } = await req.json()
  if (!student_id || !resource_id) {
    return NextResponse.json({ error: 'student_id and resource_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('student_resources')
    .upsert({ student_id, resource_id, note: note || null }, { onConflict: 'student_id,resource_id' })
    .select(`*, resource:resources(*)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - unassign a resource from a student
export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, resource_id } = await req.json()
  if (!student_id || !resource_id) {
    return NextResponse.json({ error: 'student_id and resource_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('student_resources')
    .delete()
    .eq('student_id', student_id)
    .eq('resource_id', resource_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
