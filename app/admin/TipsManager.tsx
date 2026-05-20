'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { useToast } from '@/lib/toast'

export default function TipsManager({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [tips, setTips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTip, setNewTip] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/tips')
    setTips(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addTip() {
    if (!newTip.trim()) return
    setSaving(true)
    const res = await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip_text: newTip }),
    })
    setSaving(false)
    if (res.ok) { toast('Tip added'); setNewTip(''); load() }
    else toast('Failed to add tip', 'error')
  }

  async function saveTip(id: string) {
    setSaving(true)
    const res = await fetch('/api/tips', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, tip_text: editText }),
    })
    setSaving(false)
    if (res.ok) { toast('Tip updated'); setEditingId(null); load() }
    else toast('Failed to update tip', 'error')
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch('/api/tips', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    toast(active ? 'Tip disabled' : 'Tip enabled')
    load()
  }

  async function deleteTip(id: string) {
    if (!confirm('Delete this tip?')) return
    await fetch('/api/tips', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast('Tip deleted')
    load()
  }

  const activeTips = tips.filter(t => t.active)
  const disabledTips = tips.filter(t => !t.active)

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
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Practice Tips</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Practice Tips</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {activeTips.length} active · {disabledTips.length} disabled · shown randomly to students below the timer
            </div>
          </div>
        </div>

        {/* Add tip */}
        <div className="card" style={{ padding: 18, marginBottom: 24 }}>
          <label style={{ marginBottom: 8 }}>Add new tip</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={newTip}
              onChange={e => setNewTip(e.target.value)}
              placeholder="Write a practice tip…"
              style={{ flex: 1, minHeight: 72, resize: 'vertical' }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addTip() }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={addTip}
              disabled={saving || !newTip.trim()}
            >
              {saving ? 'Adding…' : '+ Add Tip'}
            </button>
          </div>
        </div>

        {/* Active tips */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Active ({activeTips.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {activeTips.map(tip => (
                <TipRow
                  key={tip.id}
                  tip={tip}
                  editingId={editingId}
                  editText={editText}
                  saving={saving}
                  onEdit={() => { setEditingId(tip.id); setEditText(tip.tip_text) }}
                  onEditChange={setEditText}
                  onSave={() => saveTip(tip.id)}
                  onCancel={() => setEditingId(null)}
                  onToggle={() => toggleActive(tip.id, tip.active)}
                  onDelete={() => deleteTip(tip.id)}
                />
              ))}
              {activeTips.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>No active tips.</div>
              )}
            </div>

            {disabledTips.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Disabled ({disabledTips.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
                  {disabledTips.map(tip => (
                    <TipRow
                      key={tip.id}
                      tip={tip}
                      editingId={editingId}
                      editText={editText}
                      saving={saving}
                      onEdit={() => { setEditingId(tip.id); setEditText(tip.tip_text) }}
                      onEditChange={setEditText}
                      onSave={() => saveTip(tip.id)}
                      onCancel={() => setEditingId(null)}
                      onToggle={() => toggleActive(tip.id, tip.active)}
                      onDelete={() => deleteTip(tip.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function TipRow({ tip, editingId, editText, saving, onEdit, onEditChange, onSave, onCancel, onToggle, onDelete }: any) {
  const isEditing = editingId === tip.id

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      {isEditing ? (
        <div>
          <textarea
            value={editText}
            onChange={e => onEditChange(e.target.value)}
            autoFocus
            style={{ width: '100%', minHeight: 72, marginBottom: 10, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
          <p style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            {tip.tip_text}
          </p>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={onEdit} style={{ padding: '4px 8px' }}>Edit</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onToggle}
              style={{ padding: '4px 8px', color: tip.active ? 'var(--text-muted)' : 'var(--green)' }}
            >
              {tip.active ? 'Disable' : 'Enable'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={onDelete} style={{ padding: '4px 8px' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
