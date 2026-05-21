import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - assign a song to a student's repertoire
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, song_id } = await req.json()
  if (!student_id || !song_id) {
    return NextResponse.json({ error: 'student_id and song_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('student_songs')
    .upsert({
      student_id,
      song_id,
      first_worked_on: new Date().toISOString().split('T')[0],
      mastery_status: 'working',
    }, { onConflict: 'student_id,song_id', ignoreDuplicates: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - remove a song from a student's repertoire
export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id, song_id } = await req.json()
  if (!student_id || !song_id) {
    return NextResponse.json({ error: 'student_id and song_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('student_songs')
    .delete()
    .eq('student_id', student_id)
    .eq('song_id', song_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
