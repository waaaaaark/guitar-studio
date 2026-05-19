import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { student_id, lesson_date, what_we_covered, focus_for_week, song_ids } = body

  // Create the lesson
  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({ student_id, lesson_date, what_we_covered, focus_for_week })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Link songs to this lesson and upsert student repertoire
  if (song_ids && song_ids.length > 0) {
    await supabase.from('lesson_songs').insert(
      song_ids.map((song_id: string) => ({ lesson_id: lesson.id, song_id }))
    )
    // Add to student's overall repertoire (ignore if already exists)
    await supabase.from('student_songs').upsert(
      song_ids.map((song_id: string) => ({
        student_id,
        song_id,
        first_worked_on: lesson_date,
      })),
      { onConflict: 'student_id,song_id', ignoreDuplicates: true }
    )
  }

  return NextResponse.json(lesson)
}
