'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { useToast } from '@/lib/toast'

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setSettings(d); setForm(d); setLoading(false) })
  }, [])

  function set(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) { toast('Settings saved'); setSettings(form) }
    else toast('Failed to save', 'error')
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify(settings)

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
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Settings</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Settings</h1>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Studio */}
            <Section title="Studio">
              <Field label="Studio Name">
                <input value={form.studio_name || ''} onChange={e => set('studio_name', e.target.value)} placeholder="Brendan's Guitar Studio" />
              </Field>
              <Field label="Your Email (for contact forms)">
                <input type="email" value={form.admin_email || ''} onChange={e => set('admin_email', e.target.value)} placeholder="your@email.com" />
              </Field>
            </Section>

            {/* Student Defaults */}
            <Section title="New Student Defaults">
              <Field label="Default Lesson Frequency">
                <select value={form.default_lesson_frequency || 'Weekly'} onChange={e => set('default_lesson_frequency', e.target.value)}>
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </Field>
              <Field label="Default Student Profile">
                <select value={form.default_student_profile || 'Teen'} onChange={e => set('default_student_profile', e.target.value)}>
                  <option>Child</option>
                  <option>Teen</option>
                  <option>Adult</option>
                </select>
              </Field>
            </Section>

            {/* Practice */}
            <Section title="Practice Timer">
              <Field label="Max session length (minutes)" hint="Timer auto-stops at this limit">
                <input type="number" min="30" max="180"
                  value={form.session_max_minutes || 90}
                  onChange={e => set('session_max_minutes', parseInt(e.target.value))} />
              </Field>
              <Field label="Daily XP cap (minutes worth)" hint="XP stops accumulating after this many minutes per day">
                <input type="number" min="60" max="300"
                  value={form.daily_practice_xp_cap || 120}
                  onChange={e => set('daily_practice_xp_cap', parseInt(e.target.value))} />
              </Field>
            </Section>

            {/* Belt System */}
            <Section title="Belt System">
              <Field label="Stripe promotion requires" hint="What must be satisfied before a student is eligible for a stripe">
                <select value={form.stripe_requirement_mode || 'both'} onChange={e => set('stripe_requirement_mode', e.target.value)}>
                  <option value="both">Both XP threshold AND checklist</option>
                  <option value="xp_only">XP threshold only</option>
                  <option value="checklist_only">Checklist only</option>
                </select>
              </Field>
            </Section>

            {hasChanges && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setForm(settings)}>Discard</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ marginBottom: hint ? 4 : 6 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  )
}
