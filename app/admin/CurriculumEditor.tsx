'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { useToast } from '@/lib/toast'

const BELTS = ['White', 'Blue', 'Purple', 'Brown', 'Black']
const STRIPES = [1, 2, 3, 4]

type Requirement = {
  id: string
  belt: string
  stripe: number
  requirement: string
  sort_order: number
}

export default function CurriculumEditor({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBelt, setSelectedBelt] = useState('White')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newReq, setNewReq] = useState('')
  const [newStripe, setNewStripe] = useState(1)
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/requirements/global')
    setRequirements(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    setSaving(true)
    const res = await fetch('/api/requirements/global', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, requirement: editText }),
    })
    setSaving(false)
    if (res.ok) { toast('Requirement updated'); setEditingId(null); load() }
    else toast('Failed to update', 'error')
  }

  async function addRequirement() {
    if (!newReq.trim()) return
    setSaving(true)
    const res = await fetch('/api/requirements/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ belt: selectedBelt, stripe: newStripe, requirement: newReq }),
    })
    setSaving(false)
    if (res.ok) { toast('Requirement added'); setNewReq(''); load() }
    else toast('Failed to add', 'error')
  }

  async function deleteRequirement(id: string) {
    if (!confirm('Delete this requirement? This also removes it from all student checklists.')) return
    const res = await fetch('/api/requirements/global', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast('Requirement deleted'); load() }
    else toast('Failed to delete', 'error')
  }

  const beltReqs = requirements.filter(r => r.belt === selectedBelt)
  const byStripe: Record<number, Requirement[]> = {}
  for (const r of beltReqs) {
    if (!byStripe[r.stripe]) byStripe[r.stripe] = []
    byStripe[r.stripe].push(r)
  }

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
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Curriculum</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Belt Curriculum
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            These are the global requirements for each stripe. Changes apply to all students.
            On individual student pages you can mark requirements as N/A or add custom ones.
          </p>
        </div>

        {/* Belt selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {BELTS.map(belt => (
            <button key={belt} onClick={() => setSelectedBelt(belt)} style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: selectedBelt === belt ? 600 : 400,
              background: selectedBelt === belt ? 'var(--accent)' : 'var(--bg-elevated)',
              color: selectedBelt === belt ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${selectedBelt === belt ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>{belt}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STRIPES.map(stripe => {
              const reqs = byStripe[stripe] || []
              return (
                <div key={stripe} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{
                    padding: '11px 16px', background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      Stripe {stripe}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {reqs.length} requirement{reqs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {reqs.map((req, i) => (
                    <div key={req.id} style={{
                      padding: '12px 16px',
                      borderBottom: i < reqs.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      {editingId === req.id ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            autoFocus
                            style={{ width: '100%', minHeight: 64, marginBottom: 8, resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => saveEdit(req.id)} disabled={saving}>
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <p style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                            {req.requirement}
                          </p>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => { setEditingId(req.id); setEditText(req.requirement) }}
                            >Edit</button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => deleteRequirement(req.id)}
                            >✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add to this stripe */}
                  <div style={{ padding: '10px 16px', background: 'var(--bg)', borderTop: reqs.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        placeholder={`Add requirement for ${selectedBelt} stripe ${stripe}…`}
                        value={newStripe === stripe ? newReq : ''}
                        onFocus={() => setNewStripe(stripe)}
                        onChange={e => { setNewStripe(stripe); setNewReq(e.target.value) }}
                        onKeyDown={e => { if (e.key === 'Enter' && newStripe === stripe) addRequirement() }}
                        style={{ flex: 1, fontSize: 13 }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setNewStripe(stripe); addRequirement() }}
                        disabled={saving || newStripe !== stripe || !newReq.trim()}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
