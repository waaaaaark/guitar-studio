'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { format } from 'date-fns'

const BELT_ORDER = ['White', 'Blue', 'Purple', 'Brown', 'Black']
const BELT_COLORS: Record<string, string> = {
  White: '#e2ddd5', Blue: '#3b7dd8', Purple: '#7c4db8', Brown: '#8b5e3c', Black: '#1a1814',
}

export default function AnalyticsPage({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm">← Back</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Analytics</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Analytics</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          {format(new Date(), 'MMMM yyyy')}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : !data ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Failed to load analytics.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Top stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {[
                { label: 'Active students', value: data.students.active },
                { label: 'Lessons this month', value: data.lessons.thisMonth },
                { label: 'Lessons last month', value: data.lessons.lastMonth },
                { label: 'Practice sessions this week', value: data.practice.sessionsThisWeek },
                { label: 'Practice minutes this week', value: data.practice.minutesThisWeek },
                { label: 'Students practicing this week', value: data.practice.studentsActivethisWeek },
                { label: 'Page views this month', value: data.pageViews.thisMonth },
              ].map(stat => (
                <div key={stat.label} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="responsive-grid">

              {/* Student page views */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Student Page Views (all time)
                </div>
                {data.pageViews.perStudent.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No views yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.pageViews.perStudent.map((s: any) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                          {s.name.replace(/__test__/g, '').trim()}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{
                            height: 6, borderRadius: 3, background: 'var(--accent)',
                            width: Math.max(4, (s.views / (data.pageViews.perStudent[0]?.views || 1)) * 80),
                            opacity: 0.7,
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>
                            {s.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Belt distribution */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Belt Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BELT_ORDER.map(belt => {
                    const count = data.belts[belt] || 0
                    const total = data.students.active || 1
                    return (
                      <div key={belt} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: 2, flexShrink: 0,
                          background: BELT_COLORS[belt],
                          border: belt === 'White' ? '1px solid var(--border)' : 'none',
                        }} />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', width: 60 }}>{belt}</span>
                        <div style={{
                          flex: 1, height: 8, background: 'var(--bg-elevated)',
                          borderRadius: 4, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 4,
                            background: BELT_COLORS[belt] === '#e2ddd5' ? 'var(--accent)' : BELT_COLORS[belt],
                            width: `${(count / total) * 100}%`,
                            border: belt === 'White' ? '1px solid var(--border)' : 'none',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 20, textAlign: 'right' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top songs */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Most Worked Songs
                </div>
                {data.topSongs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No songs yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.topSongs.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.title.replace(/__test__/g, '').trim()}
                          </div>
                          {s.artist && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.artist}</div>}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {s.count} student{s.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top streaks */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Current Practice Streaks
                </div>
                {data.topStreaks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active streaks.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.topStreaks.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          {s.name.replace(/__test__/g, '').trim()}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                          🔥 {s.streak}d
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
