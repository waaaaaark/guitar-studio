'use client'

import { useState } from 'react'
import type { Student } from '@/lib/supabase'

type Props = { student?: Student; onClose: () => void; onSaved: () => void }

export default function StudentModal({ student, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    skill_level: student?.skill_level || 'Beginner',
    lesson_frequency: student?.lesson_frequency || 'Weekly',
    start_date: student?.start_date || new Date().toISOString().split('T')[0],
    admin_notes: student?.admin_notes || '',
    student_profile: student?.student_profile || 'Teen',
    belt_system_active: student?.belt_system_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const res = student
      ? await fetch(`/api/students/${student.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) onSaved()
    else { const d = await res.json(); setError(d.error || 'Something went wrong') }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 460, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {student ? 'Edit Student' : 'Add Student'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student name" autoFocus />
          </div>
          <div>
            <label>Email (optional)</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@email.com" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Skill Level</label>
              <select value={form.skill_level} onChange={e => set('skill_level', e.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label>Frequency</label>
              <select value={form.lesson_frequency} onChange={e => set('lesson_frequency', e.target.value)}>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Student Profile</label>
              <select value={form.student_profile} onChange={e => set('student_profile', e.target.value)}>
                <option>Child</option>
                <option>Teen</option>
                <option>Adult</option>
              </select>
            </div>
            <div>
              <label>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Belt System</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Enable XP, belts, and practice tracking</div>
            </div>
            <button
              onClick={() => set('belt_system_active', !form.belt_system_active)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: form.belt_system_active ? 'var(--accent)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: form.belt_system_active ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
          <div>
            <label>Private Notes (admin only)</label>
            <textarea value={form.admin_notes} onChange={e => set('admin_notes', e.target.value)}
              placeholder="Anything to remember about this student…" style={{ minHeight: 70 }} />
          </div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : student ? 'Save changes' : 'Add student'}
          </button>
        </div>
      </div>
    </div>
  )
}
