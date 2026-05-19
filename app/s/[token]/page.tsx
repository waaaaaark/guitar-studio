import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { Lesson, Song } from '@/lib/supabase'

async function getStudentData(token: string) {
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('token', token)
    .eq('active', true)
    .single()

  if (!student) return null

  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      *,
      lesson_songs (
        song:songs (*)
      )
    `)
    .eq('student_id', student.id)
    .order('lesson_date', { ascending: false })

  const { data: repertoire } = await supabase
    .from('student_songs')
    .select(`song:songs(*), first_worked_on`)
    .eq('student_id', student.id)
    .order('first_worked_on', { ascending: false })

  return { student, lessons: lessons || [], repertoire: repertoire || [] }
}

export default async function StudentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getStudentData(token)

  if (!data) notFound()

  const { student, lessons, repertoire } = data
  const latestLesson = lessons[0]
  const pastLessons = lessons.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '32px 24px 24px',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Guitar Studio
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 'normal', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {student.name}
        </h1>
        <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
          Student since {format(new Date(student.start_date), 'MMMM yyyy')}
          {' · '}
          {student.lesson_count} lesson{student.lesson_count !== 1 ? 's' : ''}
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Latest lesson */}
        {latestLesson ? (
          <section className="fade-in" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>
                Last Lesson
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {format(new Date(latestLesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')}
              </span>
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                  What we covered
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {latestLesson.what_we_covered}
                </p>
              </div>

              <hr className="divider" />

              <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 6, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10 }}>
                  Focus this week
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {latestLesson.focus_for_week}
                </p>
              </div>

              {latestLesson.lesson_songs && latestLesson.lesson_songs.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Songs this lesson
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(latestLesson.lesson_songs as any[]).map((ls: any) => (
                      <span key={ls.song.id} className="tag tag-skill">
                        {ls.song.title}{ls.song.artist ? ` — ${ls.song.artist}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div style={{ color: 'var(--text-muted)', marginBottom: 48 }}>No lessons logged yet.</div>
        )}

        {/* Repertoire */}
        {repertoire.length > 0 && (
          <section className="fade-in" style={{ marginBottom: 48, animationDelay: '0.1s', opacity: 0 }}>
            <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 20 }}>
              Our Repertoire
            </h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {(repertoire as any[]).map((item: any, i: number) => (
                <div key={item.song.id} style={{
                  padding: '14px 20px',
                  borderBottom: i < repertoire.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>{item.song.title}</span>
                    {item.song.artist && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: 10, fontSize: 14 }}>
                        {item.song.artist}
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {format(new Date(item.first_worked_on + 'T12:00:00'), 'MMM yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past lessons */}
        {pastLessons.length > 0 && (
          <section className="fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 20 }}>
              Past Lessons
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastLessons.map((lesson: any) => (
                <details key={lesson.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <summary style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    listStyle: 'none',
                    color: 'var(--text-secondary)',
                    userSelect: 'none',
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')}
                    </span>
                    <span style={{ fontSize: 13 }}>↓</span>
                  </summary>
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 16, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
                        What we covered
                      </div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 15 }}>
                        {lesson.what_we_covered}
                      </p>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Focus
                      </div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 15 }}>
                        {lesson.focus_for_week}
                      </p>
                    </div>
                    {lesson.lesson_songs && lesson.lesson_songs.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
                          Songs
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {lesson.lesson_songs.map((ls: any) => (
                            <span key={ls.song.id} className="tag tag-skill" style={{ fontSize: 12 }}>
                              {ls.song.title}{ls.song.artist ? ` — ${ls.song.artist}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
