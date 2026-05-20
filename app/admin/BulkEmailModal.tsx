'use client'

import { useState } from 'react'
import type { Student } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

type Props = {
  students: Student[]
  onClose: () => void
}

export default function BulkEmailModal({ students, onClose }: Props) {
  const { toast } = useToast()
  const withEmail = students.filter(s => s.email && s.active)
  const withoutEmail = students.filter(s => !s.email && s.active)
  const [selected, setSelected] = useState<Set<string>>(new Set(withEmail.map(s => s.id)))
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ sent: number; failed: number; failedNames: string[] } | null>(null)

  function toggle(id: string) {
    setSelected(p => {
      const next = new Set(p)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function send() {
    if (!subject.trim() || !body.trim()) { toast('Subject and message required', 'error'); return }
    setSending(true)
    const res = await fetch('/api/bulk-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids: Array.from(selected), subject, body }),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) {
      setDone(data)
      if (data.sent > 0) toast(`Sent to ${data.sent} student${data.sent !== 1 ? 's' : ''}`)
    } else {
      toast(data.error || 'Send failed', 'error')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 540, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Bulk Email</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {done ? (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Sent to {done.sent} student{done.sent !== 1 ? 's' : ''}
              </div>
              {done.failed > 0 && (
                <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 6 }}>
                  Failed: {done.failedNames.join(', ')}
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Recipient selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ margin: 0 }}>Recipients ({selected.size} selected)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set(withEmail.map(s => s.id)))}>All</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>None</button>
                </div>
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {withEmail.map((s, i) => (
                  <div key={s.id} onClick={() => toggle(s.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    cursor: 'pointer', borderBottom: i < withEmail.length - 1 ? '1px solid var(--border)' : 'none',
                    background: selected.has(s.id) ? 'var(--accent-glow)' : 'transparent',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${selected.has(s.id) ? 'var(--accent)' : 'var(--border-light)'}`,
                      background: selected.has(s.id) ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected.has(s.id) && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{s.name.replace(/__test__/g, '').trim()}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>{s.email}</span>
                  </div>
                ))}
              </div>
              {withoutEmail.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {withoutEmail.length} active student{withoutEmail.length !== 1 ? 's' : ''} without email: {withoutEmail.map(s => s.name.replace(/__test__/g, '').trim()).join(', ')}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label>Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Studio closed next Monday" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write your message here…" style={{ minHeight: 120 }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={send} disabled={sending || selected.size === 0}>
                {sending ? 'Sending…' : `Send to ${selected.size} student${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
