import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/lib/theme'
import ExportButton from './ExportButton'
import StudentInteractive from './StudentInteractive'
import { STRIPE_XP, type Belt } from '@/lib/supabase'
import PageViewTracker from './PageViewTracker'

async function getStudentData(token: string) {
  const { data: student } = await supabase
    .from('students').select('*').eq('token', token).eq('active', true).single()
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
  const stripeThreshold = STRIPE_XP[student.belt as Belt] || 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 680, margin: '0 auto', padding: '14px 20px',
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

      <PageViewTracker token={token} />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 80px' }}>
        <StudentInteractive
          token={token}
          student={student}
          lessons={lessons}
          repertoire={repertoire}
          stripeThreshold={stripeThreshold}
        />
      </main>
    </div>
  )
}
