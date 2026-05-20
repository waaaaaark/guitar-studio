import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ThemeToggle } from '@/lib/theme'
import ExportButton from './ExportButton'
import PastLessons from './PastLessons'
import RepertoireList from './RepertoireList'
import StudentInteractive from './StudentInteractive'
import StudentResources from './StudentResources'
import { STRIPE_XP, type Belt, type StudentProfile } from '@/lib/supabase'

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
    .select(`*, lesson_songs(song:songs(*))`)
    .eq('student_id', student.id)
    .order('lesson_date', { ascending: false })

  const { data: repertoire } = await supabase
    .from('student_songs')
    .select(`song:songs(*), first_worked_on, mastery_status, mastered_at`)
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
  const stripeThreshold = STRIPE_XP[student.belt as Belt] || 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 680, margin: '0 auto',
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Guitar Studio
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 'normal', color: 'var(--text-primary)', marginTop: 2 }}>
              {student.name}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExportButton student={student} lessons={lessons} repertoire={repertoire} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Interactive section — belt, practice timer, song mastery */}
        <StudentInteractive
          token={token}
          student={student}
          repertoire={repertoire}
          stripeThreshold={stripeThreshold}
        />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'Student since', value: format(new Date(student.start_date + 'T12:00:00'), 'MMM yyyy') },
            { label: 'Lessons', value: student.lesson_count },
            { label: 'Practice time', value: `${Math.round(student.total_practice_minutes / 60 * 10) / 10}h` },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '12px 18px', flex: '1 1 100px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', marginTop: 4 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Latest lesson */}
        {latestLesson ? (
          <section className="fade-in" style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'sans-serif' }}>
                Last Lesson
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'sans-serif' }}>
                {format(new Date(latestLesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                  What we covered
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {latestLesson.what_we_covered}
                </p>
              </div>
              <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-tag-border)', borderRadius: 6, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                  Focus this week
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {latestLesson.focus_for_week}
                </p>
              </div>
              {(latestLesson as any).lesson_songs?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                    Songs this lesson
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(latestLesson as any).lesson_songs.map((ls: any) => (
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
          <div className="card" style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 40, fontFamily: 'sans-serif' }}>
            No lessons logged yet.
          </div>
        )}

        {/* Repertoire */}
        {repertoire.length > 0 && (
          <section className="fade-in" style={{ marginBottom: 40, animationDelay: '0.1s', opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'sans-serif' }}>
                Our Repertoire
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                {repertoire.length} song{repertoire.length !== 1 ? 's' : ''}
              </span>
            </div>
            <RepertoireList repertoire={repertoire} />
          </section>
        )}

        {/* Resources */}
        <StudentResources token={token} />

        {/* Past lessons */}
        {pastLessons.length > 0 && (
          <section className="fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 14, fontFamily: 'sans-serif' }}>
              Past Lessons
            </h2>
            <PastLessons lessons={pastLessons} />
          </section>
        )}
      </main>
    </div>
  )
}
