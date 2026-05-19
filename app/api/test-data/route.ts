import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const TEST_TAG = '__test__'

const TEST_STUDENTS = [
  { name: `Alex Rivera ${TEST_TAG}`, email: null, skill_level: 'Beginner', lesson_frequency: 'Weekly', start_date: '2024-09-01' },
  { name: `Jamie Chen ${TEST_TAG}`, email: 'jamie@example.com', skill_level: 'Intermediate', lesson_frequency: 'Weekly', start_date: '2024-01-15' },
  { name: `Sam Torres ${TEST_TAG}`, email: null, skill_level: 'Advanced', lesson_frequency: 'Bi-weekly', start_date: '2023-06-01' },
]

const TEST_SONGS = [
  { title: `Wish You Were Here ${TEST_TAG}`, artist: 'Pink Floyd' },
  { title: `Blackbird ${TEST_TAG}`, artist: 'The Beatles' },
  { title: `Hotel California ${TEST_TAG}`, artist: 'Eagles' },
  { title: `Wonderwall ${TEST_TAG}`, artist: 'Oasis' },
]

const LESSON_TEMPLATES = [
  {
    what_we_covered: 'Worked on open chord transitions, focusing on G to C to D progression. Also introduced fingerpicking pattern #1.',
    focus_for_week: 'Practice the G-C-D transition slowly with a metronome at 60bpm. Aim for clean chord shapes before speeding up.',
  },
  {
    what_we_covered: 'Reviewed last week\'s chord work — great improvement. Started learning the intro riff and discussed song structure.',
    focus_for_week: 'Run through the intro riff 10 times a day. Focus on muting unwanted strings with your palm.',
  },
  {
    what_we_covered: 'Scales — pentatonic minor in the key of A. Covered positions 1 and 2. Great ear for finding the root notes.',
    focus_for_week: 'Practice position 1 up and down until it\'s automatic. Try playing along with a backing track in A minor.',
  },
]

// POST: generate test data
// DELETE: remove test data
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if test data already exists
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .like('name', `%${TEST_TAG}%`)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Test data already exists. Remove it first.' }, { status: 400 })
  }

  // Insert test songs
  const { data: songs } = await supabase
    .from('songs')
    .insert(TEST_SONGS)
    .select()

  if (!songs) return NextResponse.json({ error: 'Failed to create test songs' }, { status: 500 })

  // Insert test students
  const { data: students } = await supabase
    .from('students')
    .insert(TEST_STUDENTS)
    .select()

  if (!students) return NextResponse.json({ error: 'Failed to create test students' }, { status: 500 })

  // Create lessons for each student
  const today = new Date()
  for (const student of students) {
    for (let i = 0; i < 3; i++) {
      const lessonDate = new Date(today)
      lessonDate.setDate(today.getDate() - i * 7)
      const dateStr = lessonDate.toISOString().split('T')[0]
      const template = LESSON_TEMPLATES[i]

      const { data: lesson } = await supabase
        .from('lessons')
        .insert({
          student_id: student.id,
          lesson_date: dateStr,
          what_we_covered: template.what_we_covered,
          focus_for_week: template.focus_for_week,
        })
        .select()
        .single()

      if (lesson) {
        // Attach 1-2 random songs to each lesson
        const songPick = songs.slice(i % songs.length, (i % songs.length) + 2)
        await supabase.from('lesson_songs').insert(
          songPick.map(s => ({ lesson_id: lesson.id, song_id: s.id }))
        )
        await supabase.from('student_songs').upsert(
          songPick.map(s => ({ student_id: student.id, song_id: s.id, first_worked_on: dateStr })),
          { onConflict: 'student_id,song_id', ignoreDuplicates: true }
        )
      }
    }
  }

  return NextResponse.json({
    ok: true,
    students: students.length,
    songs: songs.length,
    lessons: students.length * 3,
  })
}

export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find test students
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .like('name', `%${TEST_TAG}%`)

  if (students && students.length > 0) {
    // Cascade deletes lessons, lesson_songs, student_songs via FK
    await supabase.from('students').delete().like('name', `%${TEST_TAG}%`)
  }

  // Remove test songs (lesson_songs already cleaned up by cascade)
  await supabase.from('songs').delete().like('title', `%${TEST_TAG}%`)

  return NextResponse.json({ ok: true, removed: students?.length || 0 })
}
