'use client'

import { useState, useEffect } from 'react'
// Inline to avoid supabase proxy client-side
const RESOURCE_ICONS: Record<string, string> = {
  PDF: '📄', Video: '🎬', Article: '📰',
  'Chord Chart': '🎸', Exercise: '🏋️', 'Backing Track': '🎵', Other: '📎',
}
import { useToast } from '@/lib/toast'
import { format } from 'date-fns'

type Props = {
  studentId: string
}

export default function ResourceAssignPanel({ studentId }: Props) {
  const { toast } = useToast()
  const [assigned, setAssigned] = useState<any[]>([])
  const [allResources, setAllResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  async function load() {
    const [assignedRes, allRes] = await Promise.all([
      fetch(`/api/resources/assign?student_id=${studentId}`),
      fetch('/api/resources'),
    ])
    const assignedData = await assignedRes.json()
    const allData = await allRes.json()
    setAssigned(assignedData)
    setAllResources(allData.filter((r: any) => r.active))
    setLoading(false)
  }

  useEffect(() => { load() }, [studentId])

  async function assign(resourceId: string, note?: string) {
    const res = await fetch('/api/resources/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, resource_id: resourceId, note }),
    })
    if (res.ok) { toast('Resource assigned'); load(); setShowPicker(false) }
    else toast('Failed to assign', 'error')
  }

  async function unassign(resourceId: string) {
    const res = await fetch('/api/resources/assign', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, resource_id: resourceId }),
    })
    if (res.ok) { toast('Resource removed'); load() }
  }

  const assignedIds = new Set(assigned.map((a: any) => a.resource_id))
  const unassigned = allResources.filter(r => !assignedIds.has(r.id))
  const filteredUnassigned = unassigned.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.resource_type.toLowerCase().includes(search.toLowerCase()) ||
    (r.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Resources</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowPicker(p => !p)}>
          {showPicker ? '↑ Close' : '+ Assign'}
        </button>
      </div>

      {/* Resource picker */}
      {showPicker && (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <input
            autoFocus
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {filteredUnassigned.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
              {unassigned.length === 0 ? 'All resources already assigned.' : 'No resources match.'}
            </div>
          ) : (
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredUnassigned.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                }}>
                  <span style={{ fontSize: 16 }}>{RESOURCE_ICONS[r.resource_type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.resource_type}</div>
                  </div>
                  {noteFor === r.id ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      <input
                        autoFocus
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Note for student (optional)…"
                        style={{ flex: 1, fontSize: 12 }}
                        onKeyDown={e => { if (e.key === 'Enter') assign(r.id, noteText || undefined) }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => assign(r.id, noteText || undefined)}>
                        Assign
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setNoteFor(null); setNoteText('') }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setNoteFor(r.id); setNoteText('') }}
                    >
                      + Assign
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assigned resources */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : assigned.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
          No resources assigned yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {assigned.map((a: any) => {
            const r = a.resource
            if (!r) return null
            return (
              <div key={a.id} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>{RESOURCE_ICONS[r.resource_type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{r.title}</div>
                  {a.note && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{a.note}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Assigned {format(new Date(a.assigned_at), 'MMM d, yyyy')}
                  </div>
                </div>
                <a href={r.url} target="_blank" rel="noopener"
                  className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>↗</a>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => unassign(r.id)}
                  style={{ padding: '4px 8px' }}
                >✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
