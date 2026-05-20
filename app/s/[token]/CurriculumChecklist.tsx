'use client'

import { useState, useEffect } from 'react'
import { BeltVisual } from '@/lib/BeltDisplay'
import { BELT_ORDER, STRIPE_XP, type Belt } from '@/lib/supabase'

type Props = {
  token: string
  belt: Belt
  stripes: number
  beltSystemActive: boolean
}

export default function CurriculumChecklist({ token, belt, stripes, beltSystemActive }: Props) {
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!beltSystemActive) { setLoading(false); return }
    fetch(`/api/requirements?belt=${belt}&token=${token}`)
      .then(r => r.json())
      .then(d => { setRequirements(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [belt, token, beltSystemActive])

  if (!beltSystemActive) return null

  // Group by stripe
  const byStripe: Record<number, any[]> = {}
  for (const r of requirements) {
    if (!byStripe[r.stripe]) byStripe[r.stripe] = []
    byStripe[r.stripe].push(r)
  }

  const nextStripe = stripes + 1
  const isBlackBelt = belt === 'Black'

  if (isBlackBelt) {
    return (
      <div style={{
        padding: '16px 18px',
        background: 'var(--bg-card)',
        borderRadius: 10,
        border: '1px solid var(--border)',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🖤</div>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Black Belt</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You've reached the highest level. Keep playing.</div>
      </div>
    )
  }

  if (loading) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(byStripe).map(([stripeNum, reqs]) => {
        const sNum = parseInt(stripeNum)
        const isPast = sNum <= stripes
        const isCurrent = sNum === nextStripe
        const isFuture = sNum > nextStripe
        const completedCount = reqs.filter(r => r.completed).length
        const allDone = completedCount === reqs.length

        return (
          <div key={stripeNum} style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            border: `1px solid ${isCurrent ? 'var(--accent-tag-border)' : 'var(--border)'}`,
            overflow: 'hidden',
            opacity: isFuture ? 0.55 : 1,
          }}>
            {/* Stripe header */}
            <div style={{
              padding: '12px 16px',
              background: isCurrent ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BeltVisual belt={belt} stripes={Math.min(sNum, 4)} size="sm" />
                <div>
                  <div style={{
                    fontWeight: 600, fontSize: 14, fontFamily: 'sans-serif',
                    color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    Stripe {stripeNum}
                    {isCurrent && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--accent)' }}>← working toward this</span>}
                    {isPast && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--green)' }}>✓ earned</span>}
                  </div>
                </div>
              </div>
              {isCurrent && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                  {completedCount}/{reqs.length} done
                </div>
              )}
              {isPast && (
                <span style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 20, fontFamily: 'sans-serif',
                  background: 'rgba(61,122,82,0.1)', color: 'var(--green)',
                  border: '1px solid rgba(61,122,82,0.25)',
                }}>✓ Complete</span>
              )}
            </div>

            {/* Requirements list */}
            <div>
              {reqs.map((req, i) => (
                <div key={req.id} style={{
                  padding: '11px 16px',
                  borderBottom: i < reqs.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: req.completed ? 'var(--green)' : 'transparent',
                    border: `2px solid ${req.completed ? 'var(--green)' : 'var(--border-light)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {req.completed && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontFamily: 'sans-serif',
                      color: req.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: req.completed ? 'line-through' : 'none',
                    }}>
                      {req.requirement}
                    </div>
                    {req.note && (
                      <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3, fontFamily: 'sans-serif' }}>
                        Note: {req.note}
                      </div>
                    )}
                    {req.completed_at && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'sans-serif' }}>
                        Completed {new Date(req.completed_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
