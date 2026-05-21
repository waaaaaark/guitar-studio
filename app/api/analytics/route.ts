import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    studentsRes,
    lessonsThisMonthRes,
    lessonsLastMonthRes,
    practiceThisWeekRes,
    pageViewsRes,
    pageViewsPerStudentRes,
    beltDistRes,
    topSongsRes,
    recentActivityRes,
  ] = await Promise.all([
    // Student counts
    supabase.from('students').select('id, active, belt, current_streak, total_practice_minutes, name').not('name', 'like', '%__test__%'),

    // Lessons this month
    supabase.from('lessons').select('id, lesson_date').gte('lesson_date', startOfMonth.split('T')[0]),

    // Lessons last month
    supabase.from('lessons').select('id').gte('lesson_date', startOfLastMonth.split('T')[0]).lt('lesson_date', startOfMonth.split('T')[0]),

    // Practice sessions this week
    supabase.from('practice_sessions').select('duration_minutes, xp_earned, student_id').gte('created_at', startOfWeek),

    // Total page views this month
    supabase.from('page_views').select('id, student_id, viewed_at').gte('viewed_at', startOfMonth),

    // Page views per student (all time)
    supabase.from('page_views').select('student_id'),

    // Belt distribution
    supabase.from('students').select('belt').not('name', 'like', '%__test__%').eq('active', true),

    // Most assigned songs
    supabase.from('student_songs').select('song_id, song:songs(title, artist)'),

    // Recent lessons
    supabase.from('lessons')
      .select('id, lesson_date, student:students(name)')
      .order('lesson_date', { ascending: false })
      .limit(5),
  ])

  const students = studentsRes.data || []
  const activeStudents = students.filter(s => s.active)
  const inactiveStudents = students.filter(s => !s.active)

  // Page views per student map
  const viewsPerStudent: Record<string, number> = {}
  for (const v of (pageViewsPerStudentRes.data || [])) {
    viewsPerStudent[v.student_id] = (viewsPerStudent[v.student_id] || 0) + 1
  }

  // Top students by page views
  const studentViewData = students
    .map(s => ({ id: s.id, name: s.name, views: viewsPerStudent[s.id] || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  // Belt distribution
  const beltCounts: Record<string, number> = {}
  for (const s of (beltDistRes.data || [])) {
    beltCounts[s.belt] = (beltCounts[s.belt] || 0) + 1
  }

  // Top songs
  const songCounts: Record<string, { title: string; artist: string | null; count: number }> = {}
  for (const ss of (topSongsRes.data || [])) {
    const id = ss.song_id
    if (!songCounts[id]) songCounts[id] = { title: (ss.song as any)?.title || '', artist: (ss.song as any)?.artist || null, count: 0 }
    songCounts[id].count++
  }
  const topSongs = Object.values(songCounts).sort((a, b) => b.count - a.count).slice(0, 10)

  // Practice stats this week
  const practiceSessions = practiceThisWeekRes.data || []
  const totalPracticeMinutesWeek = practiceSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const uniquePracticingStudents = new Set(practiceSessions.map(s => s.student_id)).size

  // Streaks
  const topStreaks = activeStudents
    .filter(s => s.current_streak > 0)
    .sort((a, b) => b.current_streak - a.current_streak)
    .slice(0, 5)
    .map(s => ({ name: s.name, streak: s.current_streak }))

  return NextResponse.json({
    students: {
      active: activeStudents.length,
      inactive: inactiveStudents.length,
      total: students.length,
    },
    lessons: {
      thisMonth: lessonsThisMonthRes.data?.length || 0,
      lastMonth: lessonsLastMonthRes.data?.length || 0,
    },
    practice: {
      sessionsThisWeek: practiceSessions.length,
      minutesThisWeek: totalPracticeMinutesWeek,
      studentsActivethisWeek: uniquePracticingStudents,
    },
    pageViews: {
      thisMonth: pageViewsRes.data?.length || 0,
      perStudent: studentViewData,
    },
    belts: beltCounts,
    topSongs,
    topStreaks,
    recentLessons: recentActivityRes.data || [],
  })
}
