'use client'

import { useState, useEffect } from 'react'
import { BeltVisual } from '@/lib/BeltDisplay'
import { useToast } from '@/lib/toast'
import { type Belt } from '@/lib/supabase'

type Props = {
  student: any
  onStudentUpdated: () => void
}

export default function RequirementsChecklist({ student, onStudentUpdated }: Props) {
  const { toast } = useToast()
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  async function load() {
    const res = await fetch(`/api/requirements?belt=${student.belt}&student_id=${student.id}`)
    const data = await res.json()
    setRequirements(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [student.id, student.belt])

  async function toggle(req: any) {
    setSavingId(req.id)
    const newCompleted = !req.completed
    await fetch('/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: student.id,
        requirement_id: req.id,
        completed: newCompleted,
        note: req.note,
      }),
    })
    setSavingId(null)
    toast(newCompleted ? 'Requirement completed ✓' : 'Requirement unchecked')
    await load()
    onStudentUpdated()
  }

  async function saveNote(req: any) {
    setSavingId(req.id)
    await fetch('/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: student.id,
        requirement_id: req.id,
        completed: req.completed,
        note: noteText.trim() || null,
      }),
    })
    setSavingId(null)
    setNoteFor(null)
    setNoteText('')
    toast('Note saved')
    load()
  }

  // Group by stripe
  const byStripe: Record<number, any[]> = {}
  for (const r of requirements) {
    if (!byStripe[r.stripe]) byStripe[r.stripe] = []
    byStripe[r.stripe].push(r)
  }

  const nextStripe = student.belt_stripes + 1

  if (loading) return (
    <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Loading requirements…</div>
  )

  if (requirements.length === 0) return (
    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No requirements found for {student.belt} Belt.</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(byStripe).map(([stripeNum, reqs]) => {
        const sNum = parseInt(stripeNum)
        const isPast = sNum <= student.belt_stripes
        const isCurrent = sNum === nextStripe
        const completedCount = reqs.filter((r: any) => r.completed).length

        return (
          <div key={stripeNum} style={{
            border: `1px solid ${isCurrent ? 'var(--accent-tag-border)' : 'var(--border)'}`,
            borderRadius: 8, overflow: 'hidden',
            opacity: sNum > nextStripe ? 0.5 : 1,
          }}>
            {/* Header */}
            <div style={{
              padding: '10px 14px',
              background: isCurrent ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BeltVisual belt={student.belt as Belt} stripes={Math.min(sNum, 4)} size="sm" />
                <span style={{
                  fontFamily: 'sans-serif', fontWeight: 600, fontSize: 13,
                  color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  Stripe {stripeNum}
                  {isCurrent && <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--accent)', fontSize: 11 }}>← current</span>}
                  {isPast && <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--green)', fontSize: 11 }}>✓ earned</span>}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                {completedCount}/{reqs.length}
              </span>
            </div>

            {/* Requirements */}
            {reqs.map((req: any, i: number) => (
              <div key={req.id} style={{
                borderBottom: i < reqs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: req.completed ? 'rgba(61,122,82,0.04)' : 'transparent',
                }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(req)}
                    disabled={savingId === req.id}
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      background: req.completed ? 'var(--green)' : 'transparent',
                      border: `2px solid ${req.completed ? 'var(--green)' : 'var(--border-light)'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {savingId === req.id
                      ? <span style={{ fontSize: 10 }}>…</span>
                      : req.completed && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>
                    }
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontFamily: 'sans-serif',
                      color: req.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: req.completed ? 'line-through' : 'none',
                      lineHeight: 1.5,
                    }}>
                      {req.requirement}
                    </div>

                    {req.note && noteFor !== req.id && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3, fontFamily: 'sans-serif' }}>
                        📝 {req.note}
                      </div>
                    )}

                    {req.completed_at && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'sans-serif' }}>
                        {new Date(req.completed_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}

                    {/* Note editor */}
                    {noteFor === req.id && (
                      <div style={{ marginTop: 8 }}>
                        <input
                          autoFocus
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add a note… (e.g. F chord clean on 5/12)"
                          style={{ fontSize: 12, marginBottom: 6 }}
                          onKeyDown={e => { if (e.key === 'Enter') saveNote(req) }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => saveNote(req)} disabled={savingId === req.id}>
                            Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setNoteFor(null); setNoteText('') }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note button */}
                  {noteFor !== req.id && (
                    <button
                      onClick={() => { setNoteFor(req.id); setNoteText(req.note || '') }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: req.note ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 14, padding: '0 4px', flexShrink: 0,
                      }}
                      title={req.note ? 'Edit note' : 'Add note'}
                    >
                      📝
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
