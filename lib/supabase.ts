import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _client = createClient(url, key)
  }
  return _client
}

// Keep named export for convenience in API routes
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

export type Student = {
  id: string
  name: string
  email: string | null
  token: string
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced'
  lesson_frequency: 'Weekly' | 'Bi-weekly' | 'Monthly'
  start_date: string
  lesson_count: number
  admin_notes: string | null
  active: boolean
  inactive_date: string | null
  created_at: string
}

export type Lesson = {
  id: string
  student_id: string
  lesson_date: string
  what_we_covered: string
  focus_for_week: string
  created_at: string
  songs?: Song[]
}

export type Song = {
  id: string
  title: string
  artist: string | null
  created_at: string
}

export type LessonSong = {
  id: string
  lesson_id: string
  song_id: string
  song?: Song
}

export type StudentSong = {
  student_id: string
  song_id: string
  first_worked_on: string
  song?: Song
}
