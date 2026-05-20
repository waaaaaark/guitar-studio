'use client'

import { useState } from 'react'
import { BeltDisplay } from '@/lib/BeltDisplay'
import PracticeTimer from '@/lib/PracticeTimer'
import { type Belt, type StudentProfile, STRIPE_XP } from '@/lib/supabase'
import CurriculumChecklist from './CurriculumChecklist'
import StudentResources from './StudentResources'
import PastLessons from './PastLessons'
import RepertoireList from './RepertoireList'
import { format } from 'date-fns'

type Props = {
  token: string
  student: any
  lessons: any[]
  repertoire: any[]
  stripeThreshold: number
}

export default function StudentInteractive({ token, student: initialStudent, lessons, repertoire, stripeThreshold }: Props) {
  const [student, setStudent] = useState(initialStudent)
  const [lastXP, setLastXP] = useState<number | null>(null)

  const beltActive = student.belt_system_active
  const tabs = [
    ...(beltActive ? [{ key: 'belt', label: '🥋 Belt' }] : []),
    { key: 'lessons', label: '📓 Lessons' },
    { key: 'resources', label: '📎 Resources' },
  ] as const

  type TabKey = 'belt' | 'lessons' | 'resources'
  const [activeTab, setActiveTab] = useState<TabKey>(beltActive ? 'belt' : 'lessons')

  const mastered = repertoire.filter((r: any) => r.mastery_status === 'mastered')
  const working = repertoire.filter((r: any) => r.mastery_status === 'working' || r.mastery_status === 'eligible')
  const latestLesson = lessons[0]
  const pastLessons = lessons.slice(1)

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as TabKey)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontSize: 13, fontFamily: 'sans-serif',
            color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontWeight: activeTab === tab.key ? 600 : 400,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Belt tab ── */}
      {activeTab === 'belt' && beltActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <BeltDisplay
            belt={student.belt as Belt}
            stripes={student.belt_stripes}
            profile={student.student_profile as StudentProfile}
            totalXP={student.total_xp}
            currentStripeXP={student.current_stripe_xp}
            stripeThreshold={stripeThreshold}
            stripeEligible={student.stripe_eligible}
            beltEligible={student.belt_eligible}
          />

          {/* Practice timer inside belt tab */}
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, fontFamily: 'sans-serif' }}>
              Log Practice
            </div>
            <PracticeTimer
              token={token}
              onSessionLogged={(xp, mins) => {
                setStudent((s: any) => ({
                  ...s,
                  total_xp: s.total_xp + xp,
                  current_stripe_xp: s.current_stripe_xp + xp,
                  total_practice_minutes: s.total_practice_minutes + mins,
                }))
                setLastXP(xp)
              }}
            />
            {lastXP !== null && lastXP > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)', fontFamily: 'sans-serif', textAlign: 'center' }}>
                +{lastXP} XP added to your belt progress!
              </div>
            )}
          </div>

          {/* Songs mastery */}
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, fontFamily: 'sans-serif' }}>
              Song Mastery
            </div>
            {mastered.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                  ✓ Mastered ({mastered.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {mastered.map((item: any) => (
                    <div key={item.song.id} style={{
                      padding: '9px 14px', borderRadius: 8,
                      background: 'rgba(61,122,82,0.08)', border: '1px solid rgba(61,122,82,0.2)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.song.title}</span>
                        {item.song.artist && <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{item.song.artist}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'sans-serif' }}>+100 XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {working.length > 0 && (
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                  Working on ({working.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {working.map((item: any) => (
                    <SongMasteryRow key={item.song.id} item={item} token={token} />
                  ))}
                </div>
              </div>
            )}
            {repertoire.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'sans-serif', textAlign: 'center', padding: '16px 0' }}>
                No songs yet — your teacher will add songs as you learn them.
              </div>
            )}
          </div>

          {/* Curriculum checklist */}
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, fontFamily: 'sans-serif' }}>
              What you're working toward
            </div>
            <CurriculumChecklist
              token={token}
              belt={student.belt as Belt}
              stripes={student.belt_stripes}
              beltSystemActive={student.belt_system_active}
            />
          </div>
        </div>
      )}

      {/* ── Lessons tab ── */}
      {activeTab === 'lessons' && (
        <div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Student since', value: format(new Date(student.start_date + 'T12:00:00'), 'MMM yyyy') },
              { label: 'Lessons', value: student.lesson_count },
              { label: 'Practice time', value: `${Math.round(student.total_practice_minutes / 60 * 10) / 10}h` },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '12px 16px', flex: '1 1 90px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'sans-serif' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Latest lesson */}
          {latestLesson ? (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'sans-serif' }}>
                  Last Lesson
                </h2>
                <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'sans-serif' }}>
                  {format(new Date(latestLesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="card" style={{ padding: '18px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                    What we covered
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {latestLesson.what_we_covered}
                  </p>
                </div>
                <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-tag-border)', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                    Focus this week
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {latestLesson.focus_for_week}
                  </p>
                </div>
                {(latestLesson as any).lesson_songs?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
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
            </div>
          ) : (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, fontFamily: 'sans-serif' }}>
              No lessons logged yet.
            </div>
          )}

          {/* Repertoire */}
          {repertoire.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'sans-serif' }}>
                  Our Repertoire
                </h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                  {repertoire.length} song{repertoire.length !== 1 ? 's' : ''}
                </span>
              </div>
              <RepertoireList repertoire={repertoire} />
            </div>
          )}

          {/* Past lessons */}
          {pastLessons.length > 0 && (
            <div>
              <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, fontFamily: 'sans-serif' }}>
                Past Lessons
              </h2>
              <PastLessons lessons={pastLessons} />
            </div>
          )}
        </div>
      )}

      {/* ── Resources tab ── */}
      {activeTab === 'resources' && (
        <StudentResources token={token} showEmpty />
      )}
    </div>
  )
}

function SongMasteryRow({ item, token }: { item: any; token: string }) {
  const [status, setStatus] = useState(item.mastery_status)
  const [loading, setLoading] = useState(false)

  async function markEligible() {
    setLoading(true)
    const res = await fetch('/api/mastery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, song_id: item.song.id }),
    })
    if (res.ok) setStatus('eligible')
    setLoading(false)
  }

  return (
    <div style={{
      padding: '9px 14px', borderRadius: 8,
      background: status === 'eligible' ? 'rgba(200,169,110,0.08)' : 'var(--bg-card)',
      border: `1px solid ${status === 'eligible' ? 'rgba(200,169,110,0.3)' : 'var(--border)'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.song.title}</span>
        {item.song.artist && <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{item.song.artist}</span>}
      </div>
      {status === 'working' ? (
        <button onClick={markEligible} disabled={loading} style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'sans-serif',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {loading ? '…' : 'I nailed it! 🎸'}
        </button>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'sans-serif', flexShrink: 0 }}>
          ⭐ Awaiting approval
        </span>
      )}
    </div>
  )
}
