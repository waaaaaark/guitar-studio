'use client'

import { useState, useEffect } from 'react'

// Inline icons to avoid supabase proxy import client-side
const RESOURCE_ICONS: Record<string, string> = {
  PDF: '📄',
  Video: '🎬',
  Article: '📰',
  'Chord Chart': '🎸',
  Exercise: '🏋️',
  'Backing Track': '🎵',
  Other: '📎',
}

type Props = { token: string }

export default function StudentResources({ token }: Props) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/resources?token=${token}`)
      .then(r => r.json())
      .then(d => { setAssignments(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (loading || assignments.length === 0) return null

  const activeAssignments = assignments.filter((a: any) => a.resource?.active)
  if (activeAssignments.length === 0) return null

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'var(--accent)', marginBottom: 14, fontFamily: 'sans-serif',
      }}>
        Resources
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeAssignments.map((assignment: any) => {
          const r = assignment.resource
          return (
            <a
              key={assignment.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                textDecoration: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-dim)'
                e.currentTarget.style.boxShadow = '0 2px 8px var(--accent-glow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {RESOURCE_ICONS[r.resource_type] || '📎'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 15 }}>
                  {r.title}
                </div>
                {r.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>
                    {r.description}
                  </div>
                )}
                {assignment.note && (
                  <div style={{ color: 'var(--accent)', fontSize: 12, marginTop: 3, fontFamily: 'sans-serif' }}>
                    {assignment.note}
                  </div>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>↗</div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
