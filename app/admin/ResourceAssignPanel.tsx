'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/toast'
import { format } from 'date-fns'

const RESOURCE_ICONS: Record<string, string> = {
  PDF: '📄', Video: '🎬', Article: '📰',
  'Chord Chart': '🎸', Exercise: '🏋️', 'Backing Track': '🎵', Other: '📎',
}

type Props = { studentId: string }

export default function ResourceAssignPanel({ studentId }: Props) {
  const { toast } = useToast()
  const [assigned, setAssigned] = useState<any[]>([])
  const [allResources, setAllResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)

  async function load() {
    const [assignedRes, allRes] = await Promise.all([
      fetch(`/api/resources/assign?student_id=${studentId}`),
      fetch('/api/resources'),
    ])
    const assignedData = await assignedRes.json()
    const allData = await allRes.json()
    setAssigned(Array.isArray(assignedData) ? assignedData : [])
    setAllResources(Array.isArray(allData) ? allData.filter((r: any) => r.active) : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [studentId])

  async function assign(resourceId: string) {
    setAssigning(resourceId)
    const res = await fetch('/api/resources/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, resource_id: resourceId }),
    })
    setAssigning(null)
    if (res.ok) { toast('Resource assigned'); load() }
    else toast('Failed to assign', 'error')
  }

  async function unassign(resourceId: string) {
    const res = await fetch('/api/resources/assign', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, resource_id: resourceId }),
    })
    if (res.ok) { toast('Resource removed'); load() }
    else toast('Failed to remove', 'error')
  }

  const assignedIds = new Set(assigned.map((a: any) => a.resource_id))
  const unassigned = allResources.filter(r => !assignedIds.has(r.id))
  const filtered = unassigned.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.resource_type.toLowerCase().includes(search.toLowerCase()) ||
    (r.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Resources</h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setShowPicker(p => !p); setSearch('') }}
        >
          {showPicker ? '↑ Close' : '+ Assign'}
        </button>
      </div>

      {/* Picker */}
      {showPicker && (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <input
            autoFocus
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {unassigned.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
              All resources already assigned.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
              No resources match.
            </div>
          ) : (
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{RESOURCE_ICONS[r.resource_type] || '📎'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.resource_type}</div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                    disabled={assigning === r.id}
                    onClick={() => assign(r.id)}
                  >
                    {assigning === r.id ? '…' : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assigned list */}
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
                <span style={{ fontSize: 16, flexShrink: 0 }}>{RESOURCE_ICONS[r.resource_type] || '📎'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {format(new Date(a.assigned_at), 'MMM d, yyyy')}
                  </div>
                </div>
                <a href={r.url} target="_blank" rel="noopener"
                  className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', flexShrink: 0 }}>↗</a>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => unassign(r.id)}
                  style={{ padding: '4px 8px', flexShrink: 0 }}
                >✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
