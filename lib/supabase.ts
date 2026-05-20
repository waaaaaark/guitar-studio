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

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

export type Belt = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black'
export type StudentProfile = 'Child' | 'Teen' | 'Adult'

export const BELT_ORDER: Belt[] = ['White', 'Blue', 'Purple', 'Brown', 'Black']
export const BELT_COLORS: Record<Belt, string> = {
  White: '#f0ece4',
  Blue: '#3b7dd8',
  Purple: '#7c4db8',
  Brown: '#8b5e3c',
  Black: '#1a1814',
}
export const BELT_TEXT_COLORS: Record<Belt, string> = {
  White: '#1a1814',
  Blue: '#ffffff',
  Purple: '#ffffff',
  Brown: '#ffffff',
  Black: '#f0ece4',
}
export const STRIPE_XP: Record<Belt, number> = {
  White: 2500,
  Blue: 4000,
  Purple: 6000,
  Brown: 8000,
  Black: 0,
}
export const SONG_MASTERY_XP = 100
export const XP_PER_MINUTE = 1
export const DAILY_MINUTE_CAP = 120
export const MAX_SESSION_MINUTES = 90
export const INACTIVITY_WARN_MINUTES = 20
export const FLAG_SESSION_MINUTES = 60

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
  student_profile: StudentProfile
  belt_system_active: boolean
  belt: Belt
  belt_stripes: number
  total_xp: number
  current_stripe_xp: number
  stripe_eligible: boolean
  belt_eligible: boolean
  current_streak: number
  longest_streak: number
  last_practice_date: string | null
  total_practice_minutes: number
}

export type Song = {
  id: string
  title: string
  artist: string | null
  created_at: string
  tags?: string[]
}

export type Lesson = {
  id: string
  student_id: string
  lesson_date: string
  what_we_covered: string
  focus_for_week: string
  created_at: string
}

export type PracticeSession = {
  id: string
  student_id: string
  session_date: string
  duration_minutes: number
  xp_earned: number
  flagged: boolean
  created_at: string
}

export type XPEvent = {
  id: string
  student_id: string
  amount: number
  reason: string
  event_type: 'practice' | 'song_mastery' | 'manual_award' | 'manual_deduct' | 'stripe_earn' | 'belt_earn'
  created_at: string
}

export type StudentSong = {
  student_id: string
  song_id: string
  first_worked_on: string
  mastery_status: 'working' | 'eligible' | 'mastered'
  mastered_at: string | null
  song?: Song
}
export type ResourceType = 'PDF' | 'Video' | 'Article' | 'Chord Chart' | 'Exercise' | 'Backing Track' | 'Other'
export const RESOURCE_TYPES: ResourceType[] = ['PDF', 'Video', 'Article', 'Chord Chart', 'Exercise', 'Backing Track', 'Other']

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  PDF: '📄',
  Video: '🎬',
  Article: '📰',
  'Chord Chart': '🎸',
  Exercise: '🏋️',
  'Backing Track': '🎵',
  Other: '📎',
}

export type Resource = {
  id: string
  title: string
  description: string | null
  resource_type: ResourceType
  source_type: 'link' | 'upload'
  url: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  tags: string[]
  active: boolean
  created_at: string
}

export type StudentResource = {
  id: string
  student_id: string
  resource_id: string
  assigned_at: string
  note: string | null
  resource?: Resource
}
