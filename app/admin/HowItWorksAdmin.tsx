'use client'

import { useState } from 'react'

export default function HowItWorksAdmin() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 20, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13,
          fontWeight: 700, fontFamily: 'sans-serif', flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        title="How the app works"
      >?</button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="card admin-sans" style={{ width: '100%', maxWidth: 560, padding: 28, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>How Guitar Studio Works</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Section title="Student Pages">
                Each student gets a unique secret URL (e.g. /s/abc123). No login required — the link is their access. Share it via the "Student page ↗" button on their detail page, or send the onboarding email which includes the link.
              </Section>

              <Section title="Logging Lessons">
                From a student's detail page, click "+ Log Lesson". Fill in what you covered and their focus for the week. Add songs from the library. If the student has an email, notes are automatically sent to them. You can also resend manually with the ✉ button on any lesson card.
              </Section>

              <Section title="Belt System">
                Students progress through 5 belts: White → Blue → Purple → Brown → Black, with 4 stripes per belt (like BJJ). Two things gate every stripe promotion:
                <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><strong>XP threshold</strong> — White: 2,500 · Blue: 4,000 · Purple: 6,000 · Brown: 8,000 per stripe</li>
                  <li><strong>Checklist</strong> — all requirements for that stripe must be checked off</li>
                </ul>
                When both are met, the student shows as "Stripe ready" and you approve it. Belt promotions (after 4 stripes) are also manually approved by you.
              </Section>

              <Section title="XP Sources">
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Practice time — 1 XP per minute (capped at 120 min/day)</li>
                  <li>Song mastery — 100 XP when you approve a "nailed it" request</li>
                  <li>Manual award — use the +XP button in the Belt Panel for anything else</li>
                  <li>Manual deduction — same button with a negative number (for cheaters 😄)</li>
                </ul>
              </Section>

              <Section title="Song Mastery">
                Students tap "I nailed it" on a song in their Practice tab. This flags it as pending on your end — you'll see a ⭐ badge on the roster and a notification at the top. Go to the student → Belt Panel → Mastery tab to approve. Approval awards 100 XP automatically.
              </Section>

              <Section title="Requirements">
                The curriculum (belt requirements) is managed under the Curriculum tab. Global requirements apply to all students. On individual student pages you can mark requirements as N/A (not applicable) or add notes to completed ones.
              </Section>

              <Section title="Certificates">
                In the Belt Panel → click "🎓 Certificate". Choose Belt Promotion or Stripe Award, enter your name and studio. Downloads a print-ready landscape PDF. Sign it by hand and present at the next lesson.
              </Section>

              <Section title="Belt Placement">
                For existing students who've been playing for years, use "✏ Place Belt" in the Belt Panel to set their belt and stripes directly. This bypasses the XP system — no XP awarded, stripe XP resets to 0.
              </Section>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={() => setOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}
