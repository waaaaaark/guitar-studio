'use client'

import { useState } from 'react'
import { BeltDisplay } from '@/lib/BeltDisplay'
import PracticeTimer from '@/lib/PracticeTimer'
import { type Belt, type StudentProfile, STRIPE_XP } from '@/lib/supabase'

type Props = {
  token: string
  student: any
  repertoire: any[]
  stripeThreshold: number
}

export default function StudentInteractive({ token, student: initialStudent, repertoire, stripeThreshold }: Props) {
  const [student, setStudent] = useState(initialStudent)
  const [activeTab, setActiveTab] = useState<'belt' | 'practice' | 'songs'>('belt')
  const [lastXP, setLastXP] = useState<number | null>(null)

  if (!student.belt_system_active && student.student_profile === 'Adult') {
    // For adults with belt off — just show practice
    return (
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 14, fontFamily: 'sans-serif' }}>
          Practice
        </h2>
        <PracticeTimer token={token} onSessionLogged={(xp, mins) => {
          setStudent((s: any) => ({
            ...s,
            total_xp: s.total_xp + xp,
            total_practice_minutes: s.total_practice_minutes + mins,
          }))
          setLastXP(xp)
        }} />
      </div>
    )
  }

  const tabs = [
    ...(student.belt_system_active ? [{ key: 'belt', label: '🥋 Belt' }] : []),
    { key: 'practice', label: '⏱ Practice' },
    { key: 'songs', label: '🎵 Songs' },
  ] as const

  const mastered = repertoire.filter((r: any) => r.mastery_status === 'mastered')
  const working = repertoire.filter((r: any) => r.mastery_status === 'working' || r.mastery_status === 'eligible')

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontSize: 13, fontFamily: 'sans-serif',
            color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontWeight: activeTab === tab.key ? 600 : 400,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Belt tab */}
      {activeTab === 'belt' && student.belt_system_active && (
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
      )}

      {/* Practice tab */}
      {activeTab === 'practice' && (
        <div style={{ position: 'relative' }}>
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
          {lastXP !== null && lastXP > 0 && student.belt_system_active && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)', fontFamily: 'sans-serif', textAlign: 'center' }}>
              +{lastXP} XP added to your belt progress!
            </div>
          )}
        </div>
      )}

      {/* Songs tab */}
      {activeTab === 'songs' && (
        <div>
          {mastered.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', marginBottom: 10, fontFamily: 'sans-serif' }}>
                ✓ Mastered ({mastered.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mastered.map((item: any) => (
                  <div key={item.song.id} style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(61,122,82,0.08)',
                    border: '1px solid rgba(61,122,82,0.2)',
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
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'sans-serif' }}>
                Working on ({working.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {working.map((item: any) => (
                  <SongMasteryRow key={item.song.id} item={item} token={token} />
                ))}
              </div>
            </div>
          )}

          {repertoire.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'sans-serif', textAlign: 'center', padding: '20px 0' }}>
              No songs yet — your teacher will add songs as you learn them.
            </div>
          )}
        </div>
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
      padding: '10px 14px', borderRadius: 8,
      background: status === 'eligible' ? 'rgba(200,169,110,0.08)' : 'var(--bg-card)',
      border: `1px solid ${status === 'eligible' ? 'rgba(200,169,110,0.3)' : 'var(--border)'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.song.title}</span>
        {item.song.artist && <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{item.song.artist}</span>}
      </div>
      {status === 'working' ? (
        <button
          onClick={markEligible}
          disabled={loading}
          style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'sans-serif',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
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
