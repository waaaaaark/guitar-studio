'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { BeltDisplay, BeltVisual } from '@/lib/BeltDisplay'
import { useToast } from '@/lib/toast'
import { STRIPE_XP, BELT_ORDER, type Belt, type StudentProfile } from '@/lib/supabase'

type Props = {
  student: any
  repertoire: any[]
  onStudentUpdated: () => void
}

export default function BeltPanel({ student, repertoire, onStudentUpdated }: Props) {
  const { toast } = useToast()
  const [xpEvents, setXpEvents] = useState<any[]>([])
  const [practiceSessions, setPracticeSessions] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [xpAmount, setXpAmount] = useState('')
  const [xpReason, setXpReason] = useState('')
  const [savingXP, setSavingXP] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'mastery' | 'history'>('overview')
  const [showPlacement, setShowPlacement] = useState(false)
  const [placementBelt, setPlacementBelt] = useState<Belt>(student.belt as Belt)
  const [placementStripes, setPlacementStripes] = useState<number>(student.belt_stripes)
  const [savingPlacement, setSavingPlacement] = useState(false)

  useEffect(() => {
    async function load() {
      const [eventsRes, practiceRes] = await Promise.all([
        fetch(`/api/xp?student_id=${student.id}`),
        fetch(`/api/practice?token=${student.token}`),
      ])
      setXpEvents(await eventsRes.json())
      setPracticeSessions(await practiceRes.json())
      setLoadingEvents(false)
    }
    load()
  }, [student.id, student.token])

  async function awardXP(isDeduct = false) {
    const amount = parseInt(xpAmount) * (isDeduct ? -1 : 1)
    if (!amount || !xpReason.trim()) { toast('Amount and reason required', 'error'); return }
    setSavingXP(true)
    const res = await fetch('/api/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, amount, reason: xpReason }),
    })
    setSavingXP(false)
    if (res.ok) {
      toast(`${isDeduct ? 'Deducted' : 'Awarded'} ${Math.abs(amount)} XP`)
      setXpAmount(''); setXpReason('')
      onStudentUpdated()
    } else toast('Failed to update XP', 'error')
  }

  async function awardStripe() {
    const res = await fetch('/api/belt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, action: 'award_stripe' }),
    })
    const d = await res.json()
    if (res.ok) { toast(`Stripe ${d.new_stripes} awarded! 🎉`); onStudentUpdated() }
    else toast(d.error || 'Error', 'error')
  }

  async function awardBelt() {
    if (!confirm(`Promote ${student.name} to ${BELT_ORDER[BELT_ORDER.indexOf(student.belt as Belt) + 1]} Belt?`)) return
    const res = await fetch('/api/belt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, action: 'award_belt' }),
    })
    const d = await res.json()
    if (res.ok) { toast(`🥋 Promoted to ${d.new_belt} Belt!`); onStudentUpdated() }
    else toast(d.error || 'Error', 'error')
  }

  async function approveMastery(songId: string, songTitle: string) {
    const res = await fetch('/api/mastery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, song_id: songId }),
    })
    if (res.ok) {
      toast(`✓ ${songTitle} mastered — +100 XP awarded!`)
      onStudentUpdated()
    }
  }

  async function placeBelt() {
    setSavingPlacement(true)
    const res = await fetch('/api/belt-placement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, belt: placementBelt, stripes: placementStripes }),
    })
    setSavingPlacement(false)
    if (res.ok) {
      toast(`Belt set to ${placementBelt} Belt, ${placementStripes} stripe${placementStripes !== 1 ? 's' : ''}`)
      setShowPlacement(false)
      onStudentUpdated()
    } else {
      toast('Failed to set belt', 'error')
    }
  }

  const stripeThreshold = STRIPE_XP[student.belt as Belt] || 0
  const eligibleSongs = repertoire.filter((r: any) => r.mastery_status === 'eligible')
  const masteredSongs = repertoire.filter((r: any) => r.mastery_status === 'mastered')

  if (!student.belt_system_active) {
    return (
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
          Belt system is disabled for this student. Enable it in Edit Student settings.
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
      {/* Belt header */}
      <div style={{
        padding: '16px 18px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <BeltVisual belt={student.belt} stripes={student.belt_stripes} size="md" />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
              {student.belt} Belt · {student.belt_stripes}/4 stripes
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 2 }}>
              {student.total_xp.toLocaleString()} total XP · {student.current_stripe_xp.toLocaleString()}/{stripeThreshold.toLocaleString()} toward next stripe
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowPlacement(p => !p); setPlacementBelt(student.belt); setPlacementStripes(student.belt_stripes) }}>
            ✏ Place Belt
          </button>
          {student.stripe_eligible && (
            <button className="btn btn-primary btn-sm" onClick={awardStripe}>
              ⭐ Award Stripe
            </button>
          )}
          {student.belt_eligible && (
            <button
              className="btn btn-primary btn-sm"
              onClick={awardBelt}
              style={{ background: 'var(--green)' }}
            >
              🥋 Promote Belt
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0, borderBottom: '1px solid var(--border)',
      }}>
        {[
          { label: 'Streak', value: `🔥 ${student.current_streak}d` },
          { label: 'Best streak', value: `${student.longest_streak}d` },
          { label: 'Total practice', value: `${Math.round(student.total_practice_minutes / 60 * 10) / 10}h` },
          { label: 'Songs mastered', value: masteredSongs.length },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            padding: '12px 14px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingLeft: 4 }}>
        {(['overview', 'mastery', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 14px', fontSize: 13, fontFamily: 'sans-serif',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, textTransform: 'capitalize',
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: '16px 18px' }}>

        {/* Overview tab — XP controls + practice chart */}
        {activeTab === 'overview' && (
          <div>
            {/* Belt placement */}
            {showPlacement && (
              <div style={{
                marginBottom: 16, padding: 14,
                background: 'var(--bg-elevated)', borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Set Belt & Stripes
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ marginBottom: 5 }}>Belt</label>
                    <select
                      value={placementBelt}
                      onChange={e => {
                        const b = e.target.value as Belt
                        setPlacementBelt(b)
                        if (b === 'Black') setPlacementStripes(0)
                      }}
                    >
                      {BELT_ORDER.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ marginBottom: 5 }}>Stripes</label>
                    <select
                      value={placementStripes}
                      onChange={e => setPlacementStripes(parseInt(e.target.value))}
                      disabled={placementBelt === 'Black'}
                    >
                      {[0, 1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n} stripe{n !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <BeltVisual belt={placementBelt} stripes={placementStripes} size="sm" />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                    Preview
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginBottom: 10 }}>
                  This places the student directly at this level — no XP awarded. Stripe XP resets to 0.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowPlacement(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={placeBelt} disabled={savingPlacement}>
                    {savingPlacement ? 'Saving…' : 'Confirm placement'}
                  </button>
                </div>
              </div>
            )}

            {/* XP award/deduct */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Adjust XP
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="number" min="1" placeholder="Amount"
                  value={xpAmount}
                  onChange={e => setXpAmount(e.target.value)}
                  style={{ width: 90, flexShrink: 0 }}
                />
                <input
                  placeholder="Reason (e.g. Great recital performance)"
                  value={xpReason}
                  onChange={e => setXpReason(e.target.value)}
                  style={{ flex: 1, minWidth: 140 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => awardXP(false)} disabled={savingXP || !xpAmount || !xpReason}>
                  + Award XP
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => awardXP(true)} disabled={savingXP || !xpAmount || !xpReason}>
                  − Deduct XP
                </button>
              </div>
            </div>

            {/* Recent practice sessions */}
            {practiceSessions.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Recent Practice
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {practiceSessions.slice(0, 8).map((s: any) => (
                    <div key={s.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '7px 10px', background: 'var(--bg-elevated)', borderRadius: 6,
                      border: s.flagged ? '1px solid rgba(192,103,90,0.3)' : '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
                          {format(new Date(s.created_at), 'MMM d')}
                        </span>
                        {s.flagged && <span style={{ fontSize: 10, color: 'var(--red)', background: 'rgba(192,103,90,0.1)', padding: '1px 6px', borderRadius: 10, border: '1px solid rgba(192,103,90,0.3)' }}>⚠ Long session</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: 'sans-serif' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{s.duration_minutes} min</span>
                        <span style={{ color: 'var(--accent)' }}>+{s.xp_earned} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mastery tab */}
        {activeTab === 'mastery' && (
          <div>
            {eligibleSongs.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  ⭐ Awaiting Your Approval ({eligibleSongs.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {eligibleSongs.map((r: any) => (
                    <div key={r.song.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'rgba(61,122,82,0.06)',
                      border: '1px solid rgba(61,122,82,0.2)', borderRadius: 8, gap: 10,
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{r.song.title}</span>
                        {r.song.artist && <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{r.song.artist}</span>}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => approveMastery(r.song.id, r.song.title)}
                      >
                        ✓ Approve +100 XP
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {masteredSongs.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Mastered ({masteredSongs.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {masteredSongs.map((r: any) => (
                    <span key={r.song.id} className="tag tag-active" style={{ fontSize: 12 }}>
                      ✓ {r.song.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {eligibleSongs.length === 0 && masteredSongs.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'sans-serif' }}>
                No songs pending approval yet.
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div>
            {loadingEvents ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : xpEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No XP events yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                {xpEvents.map((e: any) => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 10px', background: 'var(--bg-elevated)', borderRadius: 6,
                    border: '1px solid var(--border)', gap: 8,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>{e.reason}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 2 }}>
                        {format(new Date(e.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif', flexShrink: 0,
                      color: e.amount > 0 ? 'var(--green)' : e.amount < 0 ? 'var(--red)' : 'var(--text-muted)',
                    }}>
                      {e.amount > 0 ? '+' : ''}{e.amount === 0 ? '🏅' : `${e.amount} XP`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
