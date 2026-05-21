'use client'

import { useState } from 'react'

type Props = {
  profile: string
  beltActive: boolean
  label?: string
}

export default function HowItWorksStudent({ profile, beltActive, label }: Props) {
  const [open, setOpen] = useState(false)
  const isAdult = profile === 'Adult'
  const isChild = profile === 'Child'

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '11px 16px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'sans-serif', transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label || (isChild ? '❓ How does this work?' : 'How this page works')}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '16px 18px',
          background: 'var(--bg-card)',
          fontSize: 14,
          fontFamily: 'sans-serif',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}>
          {isAdult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>This is your personal lesson hub. Your teacher updates it after each session.</p>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Lessons tab</strong>
                <p style={{ marginTop: 2 }}>Your lesson notes, weekly focus, song repertoire, and full lesson history.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Practice tab</strong>
                <p style={{ marginTop: 2 }}>Log your practice time and mark songs you feel you've mastered — your teacher will confirm them.</p>
              </div>
              {beltActive && (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Belt tab</strong>
                  <p style={{ marginTop: 2 }}>Your progress is tracked through a belt system. Practice time and mastered songs earn XP. Your teacher promotes you through the belts as you develop.</p>
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Resources tab</strong>
                <p style={{ marginTop: 2 }}>Learning materials your teacher has shared with you.</p>
              </div>
            </div>
          ) : isChild ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>🎸 Welcome to your Guitar Studio page! Here's what everything does:</p>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>📓 Lessons</strong>
                <p style={{ marginTop: 2 }}>See what you worked on in your last lesson and what to practice this week!</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>⏱ Practice</strong>
                <p style={{ marginTop: 2 }}>Start the timer when you practice and earn XP! When you've got a song down, tap "I nailed it" — your teacher will give you the XP if they agree.</p>
              </div>
              {beltActive && (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>🥋 Belt</strong>
                  <p style={{ marginTop: 2 }}>Just like karate, you earn belts! Practice earns XP, and XP earns stripes. Get 4 stripes and your teacher can promote you to the next belt. Work hard and you could make it to Black Belt! 🖤</p>
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>📎 Resources</strong>
                <p style={{ marginTop: 2 }}>Chord charts, videos, and other helpful stuff your teacher shares with you.</p>
              </div>
            </div>
          ) : (
            // Teen
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>Your personal lesson hub — updated by your teacher after each session.</p>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Lessons</strong> — lesson notes, focus for the week, your full song history.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Practice</strong> — log practice time to earn XP, mark songs as mastered (teacher confirms).
              </div>
              {beltActive && (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Belt</strong> — a progression system (think jiu jitsu) tracking your development. XP comes from practice and mastered songs. Your teacher promotes you through the belts.
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Resources</strong> — materials your teacher has assigned you.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
