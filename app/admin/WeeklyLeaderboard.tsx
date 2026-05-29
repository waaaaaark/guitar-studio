'use client'

import { useState, useEffect } from 'react'

type LeaderboardEntry = {
  id: string
  name: string
  belt: string
  weekly_xp: number
}

type Props = {
  // token prop scaffolds future student-facing use: pass a student token to fetch
  // via token auth instead of admin session. Omit on admin pages.
  token?: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function WeeklyLeaderboard({ token }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = token ? `/api/leaderboard?token=${token}` : '/api/leaderboard'
    fetch(url)
      .then(r => r.json())
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (loading || entries.length === 0) return null

  const top = entries.slice(0, 5)
  const maxXP = top[0].weekly_xp

  return (
    <div style={{
      marginBottom: 20, padding: '14px 16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15 }}>📈</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
          XP Leaders — last 7 days
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {top.map((entry, i) => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, width: 22, flexShrink: 0, textAlign: 'center' }}>
              {MEDALS[i] ?? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</span>}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, minWidth: 100, flexShrink: 0 }}>
              {entry.name}
            </span>
            <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((entry.weekly_xp / maxXP) * 100)}%`,
                background: 'var(--accent)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, minWidth: 52, textAlign: 'right', flexShrink: 0 }}>
              {entry.weekly_xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
