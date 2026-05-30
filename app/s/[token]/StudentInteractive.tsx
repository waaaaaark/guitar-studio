'use client'

import { useState } from 'react'
import { BeltDisplay } from '@/lib/BeltDisplay'
import PracticeTimer from '@/lib/PracticeTimer'
import { type Belt, type StudentProfile, STRIPE_XP } from '@/lib/supabase'
import CurriculumChecklist from './CurriculumChecklist'
import HowItWorksStudent from './HowItWorksStudent'
import StudentResources from './StudentResources'
import StudentTempFiles from './StudentTempFiles'
import PastLessons from './PastLessons'
import RepertoireList from './RepertoireList'
import { format } from 'date-fns'

type Props = {
  token: string
  student: any
  lessons: any[]
  repertoire: any[]
  stripeThreshold: number
  weeklyPracticeMinutes: number
}

type TabKey = 'belt' | 'lessons' | 'practice' | 'resources'

export default function StudentInteractive({ token, student: initialStudent, lessons, repertoire, stripeThreshold, weeklyPracticeMinutes: initialWeeklyMinutes }: Props) {
  const [student, setStudent] = useState(initialStudent)
  const [lastXP, setLastXP] = useState<number | null>(null)
  const [weeklyMinutes, setWeeklyMinutes] = useState(initialWeeklyMinutes)
  const beltActive = student.belt_system_active

  const [activeTab, setActiveTab] = useState<TabKey>(beltActive ? 'belt' : 'lessons')

  const mastered = repertoire.filter((r: any) => r.mastery_status === 'mastered')
  const working = repertoire.filter((r: any) => r.mastery_status === 'working' || r.mastery_status === 'eligible')
  const latestLesson = lessons[0]
  const pastLessons = lessons.slice(1)

  // Tab definitions — drop icons, keep short labels
  const tabs: { key: TabKey; label: string }[] = [
    ...(beltActive ? [{ key: 'belt' as TabKey, label: 'Belt' }] : []),
    { key: 'lessons', label: 'Lessons' },
    { key: 'practice', label: 'Practice' },
    { key: 'resources', label: 'Files' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '9px 14px', fontSize: 13, fontFamily: 'sans-serif',
            color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontWeight: activeTab === tab.key ? 600 : 400,
            whiteSpace: 'nowrap', flex: 1, textAlign: 'center',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── BELT TAB ── */}
      {activeTab === 'belt' && beltActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 14, fontFamily: 'sans-serif' }}>
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

      {/* ── LESSONS TAB ── */}
      {activeTab === 'lessons' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Student since', value: format(new Date(student.start_date + 'T12:00:00'), 'MMM yyyy') },
              { label: 'Lessons', value: student.lesson_count },
              { label: 'Practice', value: `${Math.round(student.total_practice_minutes / 60 * 10) / 10}h` },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '11px 14px', flex: '1 1 90px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-primary)', marginTop: 3, fontFamily: 'sans-serif' }}>
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
            <div className="card" style={{ padding: 20, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, fontFamily: 'sans-serif' }}>
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

      {/* ── PRACTICE TAB ── */}
      {activeTab === 'practice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Weekly goal */}
          <PracticeGoal
            token={token}
            goalMinutes={student.practice_goal_minutes_week ?? null}
            weeklyMinutes={weeklyMinutes}
            onGoalSaved={(g) => setStudent((s: any) => ({ ...s, practice_goal_minutes_week: g }))}
          />

          {/* Timer */}
          <div>
            <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 14, fontFamily: 'sans-serif' }}>
              Log Practice
            </h2>
            <PracticeTimer
              token={token}
              onSessionLogged={(xp, mins) => {
                setStudent((s: any) => ({
                  ...s,
                  total_xp: s.total_xp + xp,
                  current_stripe_xp: s.current_stripe_xp + xp,
                  total_practice_minutes: s.total_practice_minutes + mins,
                }))
                setWeeklyMinutes(m => m + mins)
                setLastXP(xp)
              }}
            />
            {lastXP !== null && lastXP > 0 && beltActive && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)', fontFamily: 'sans-serif', textAlign: 'center' }}>
                +{lastXP} XP added to your belt progress!
              </div>
            )}
          </div>

          {/* Song mastery */}
          <div>
            <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 14, fontFamily: 'sans-serif' }}>
              Song Mastery
            </h2>

            {mastered.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', marginBottom: 8, fontFamily: 'sans-serif' }}>
                  Mastered ({mastered.length})
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
                      {beltActive && <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'sans-serif' }}>+100 XP</span>}
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
        </div>
      )}

      {/* ── FILES TAB ── */}
      {activeTab === 'resources' && (
        <div>
          <StudentTempFiles token={token} />
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, fontFamily: 'sans-serif' }}>
            Learning Resources
          </div>
          <StudentResources token={token} showEmpty />
        </div>
      )}
      {/* How does this page work - at the bottom */}
      <div style={{ marginTop: 32 }}>
        <HowItWorksStudent profile={student.student_profile} beltActive={beltActive} label="How does this page work?" />
      </div>
    </div>
  )
}

function PracticeGoal({ token, goalMinutes, weeklyMinutes, onGoalSaved }: {
  token: string
  goalMinutes: number | null
  weeklyMinutes: number
  onGoalSaved: (g: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(goalMinutes != null ? String(goalMinutes) : '')
  const [saving, setSaving] = useState(false)

  async function saveGoal() {
    setSaving(true)
    const goal = input.trim() === '' ? null : Number(input)
    await fetch('/api/practice', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, goal_minutes_week: goal }),
    })
    setSaving(false)
    onGoalSaved(goal)
    setEditing(false)
  }

  if (goalMinutes == null && !editing) {
    return (
      <div style={{ marginBottom: 4 }}>
        <button
          onClick={() => setEditing(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif', padding: 0, textDecoration: 'underline dotted' }}
        >
          Set a weekly practice goal
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10, fontFamily: 'sans-serif' }}>
          Weekly Goal
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min={0}
            step={15}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="minutes per week"
            autoFocus
            style={{ width: 140, fontSize: 13 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>min / week</span>
          <button onClick={saveGoal} disabled={saving} style={{
            padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: 'white', fontSize: 13, fontFamily: 'sans-serif',
          }}>
            {saving ? '…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>×</button>
        </div>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((weeklyMinutes / goalMinutes!) * 100))
  const hit = weeklyMinutes >= goalMinutes!
  const hoursLogged = (weeklyMinutes / 60).toFixed(1)
  const hoursGoal = (goalMinutes! / 60).toFixed(1)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'sans-serif' }}>
          This Week's Goal
        </div>
        <button
          onClick={() => { setInput(String(goalMinutes)); setEditing(true) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'sans-serif', padding: 0 }}
        >
          edit
        </button>
      </div>
      <div style={{
        padding: '14px 16px', borderRadius: 10,
        background: hit ? 'rgba(61,122,82,0.08)' : 'var(--bg-card)',
        border: `1px solid ${hit ? 'rgba(61,122,82,0.25)' : 'var(--border)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: hit ? 'var(--green)' : 'var(--text-primary)', fontFamily: 'sans-serif' }}>
            {weeklyMinutes} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/ {goalMinutes} min</span>
          </span>
          <span style={{ fontSize: 13, color: hit ? 'var(--green)' : 'var(--text-muted)', fontFamily: 'sans-serif' }}>
            {hit ? '✓ Goal hit!' : `${pct}%`}
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: hit ? 'var(--green)' : 'var(--accent)',
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {!hit && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'sans-serif' }}>
            {goalMinutes! - weeklyMinutes} min to go this week
          </div>
        )}
      </div>
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
