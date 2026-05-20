'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MAX_SESSION_MINUTES, INACTIVITY_WARN_MINUTES, XP_PER_MINUTE } from '@/lib/supabase'

type Props = {
  token: string
  onSessionLogged: (xp: number, minutes: number) => void
}

type Phase = 'idle' | 'running' | 'paused' | 'confirm' | 'done' | 'manual'

export default function PracticeTimer({ token, onSessionLogged }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0) // seconds
  const [showInactivityPrompt, setShowInactivityPrompt] = useState(false)
  const [manualMinutes, setManualMinutes] = useState('')
  const [lastXP, setLastXP] = useState(0)
  const [capped, setCapped] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tips?mode=random')
      .then(r => r.json())
      .then(d => setTip(d.tip_text || null))
      .catch(() => {})
  }, [])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)

  const MAX_SECONDS = MAX_SESSION_MINUTES * 60
  const INACTIVITY_SECONDS = INACTIVITY_WARN_MINUTES * 60

  const clearInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
  }, [])

  const resetInactivityTimer = useCallback(() => {
    clearInactivity()
    inactivityRef.current = setTimeout(() => {
      setShowInactivityPrompt(true)
      setPhase(p => p === 'running' ? 'paused' : p)
    }, INACTIVITY_SECONDS * 1000)
  }, [clearInactivity, INACTIVITY_SECONDS])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed * 1000
    intervalRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      if (secs >= MAX_SECONDS) {
        setElapsed(MAX_SECONDS)
        setPhase('confirm')
        if (intervalRef.current) clearInterval(intervalRef.current)
        clearInactivity()
      } else {
        setElapsed(secs)
      }
    }, 500)
    resetInactivityTimer()
  }, [elapsed, MAX_SECONDS, clearInactivity, resetInactivityTimer])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    clearInactivity()
  }, [clearInactivity])

  useEffect(() => {
    if (phase === 'running') startTimer()
    else stopTimer()
    return stopTimer
  }, [phase])

  // Page visibility API — pause when tab hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && phase === 'running') {
        setPhase('paused')
        setShowInactivityPrompt(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [phase])

  async function submitSession(minutes: number) {
    setSubmitting(true)
    const res = await fetch('/api/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, duration_minutes: minutes }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setLastXP(data.xp_earned)
      setCapped(data.capped)
      setPhase('done')
      onSessionLogged(data.xp_earned, data.minutes_logged)
      // Refresh tip
      fetch('/api/tips?mode=random')
        .then(r => r.json())
        .then(d => setTip(d.tip_text || null))
        .catch(() => {})
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const minutes = Math.floor(elapsed / 60)
  const progress = (elapsed / MAX_SECONDS) * 100

  // Done state
  if (phase === 'done') {
    return (
      <div style={{
        textAlign: 'center', padding: '28px 20px',
        background: 'var(--bg-card)', borderRadius: 12,
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎸</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'sans-serif', marginBottom: 4 }}>
          Great practice!
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontFamily: 'sans-serif', marginBottom: 12 }}>
          You earned <strong style={{ color: 'var(--accent)' }}>+{lastXP} XP</strong>
          {capped && <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
            (Daily XP cap reached — time still counts!)
          </span>}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setPhase('idle'); setElapsed(0); setLastXP(0); setCapped(false) }}
        >
          Log another session
        </button>
      </div>
    )
  }

  return (
    <>
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12,
      border: '1px solid var(--border)', overflow: 'hidden',
    }}>
      {/* Inactivity prompt overlay */}
      {showInactivityPrompt && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, borderRadius: 12,
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: 24, borderRadius: 10,
            textAlign: 'center', maxWidth: 260,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏸️</div>
            <div style={{ fontFamily: 'sans-serif', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Still practicing?
            </div>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Your timer paused. Tap to keep going!
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setShowInactivityPrompt(false); setPhase('running') }}
            >
              Keep going! ▶
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => { setShowInactivityPrompt(false); setPhase('confirm') }}
            >
              I'm done
            </button>
          </div>
        </div>
      )}

      {/* Confirm submit */}
      {phase === 'confirm' && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {elapsed >= MAX_SECONDS ? '⏰' : '✅'}
          </div>
          <div style={{ fontFamily: 'sans-serif', fontWeight: 600, color: 'var(--text-primary)', fontSize: 16, marginBottom: 4 }}>
            {elapsed >= MAX_SECONDS ? 'Max session reached!' : 'Done practicing?'}
          </div>
          <div style={{ fontFamily: 'sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            {minutes} minute{minutes !== 1 ? 's' : ''} = <strong style={{ color: 'var(--accent)' }}>+{minutes} XP</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {elapsed < MAX_SECONDS && (
              <button className="btn btn-ghost" onClick={() => setPhase('running')}>
                Keep going
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => submitSession(minutes)}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Log it! 🎸'}
            </button>
          </div>
        </div>
      )}

      {/* Manual entry */}
      {phase === 'manual' && (
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: 'sans-serif', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Log practice manually
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[15, 20, 30, 45, 60].map(m => (
              <button key={m} onClick={() => setManualMinutes(String(m))}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13,
                  background: manualMinutes === String(m) ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: manualMinutes === String(m) ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  fontFamily: 'sans-serif',
                }}
              >{m} min</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <input
              type="number" min="1" max="120"
              placeholder="Or enter minutes…"
              value={manualMinutes}
              onChange={e => setManualMinutes(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif', fontSize: 13 }}>min</span>
          </div>
          {manualMinutes && Number(manualMinutes) > 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginBottom: 12 }}>
              = <strong style={{ color: 'var(--accent)' }}>+{Math.min(Number(manualMinutes), 120)} XP</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { setPhase('idle'); setManualMinutes('') }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!manualMinutes || Number(manualMinutes) < 1 || submitting}
              onClick={() => submitSession(Math.min(Number(manualMinutes), 120))}
            >
              {submitting ? 'Saving…' : 'Log it!'}
            </button>
          </div>
        </div>
      )}

      {/* Idle / Running / Paused */}
      {(phase === 'idle' || phase === 'running' || phase === 'paused') && (
        <div style={{ position: 'relative' }}>
          {/* Progress bar at top */}
          <div style={{ height: 4, background: 'var(--border)' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent)',
              transition: 'width 0.5s linear',
            }} />
          </div>

          <div style={{ padding: 24, textAlign: 'center' }}>
            {/* Timer display */}
            <div style={{
              fontSize: 52,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: phase === 'running' ? 'var(--text-primary)' : 'var(--text-muted)',
              letterSpacing: '-2px',
              marginBottom: 6,
              transition: 'color 0.3s',
            }}>
              {formatTime(elapsed)}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginBottom: 20 }}>
              {phase === 'idle' && 'Ready to practice?'}
              {phase === 'running' && `${minutes} min = ${minutes} XP so far`}
              {phase === 'paused' && 'Paused — tap to resume'}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {phase === 'idle' && (
                <>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 16, padding: '12px 28px' }}
                    onClick={() => { setElapsed(0); setPhase('running') }}
                  >
                    ▶ Start Practice
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setPhase('manual')}
                  >
                    Log manually
                  </button>
                </>
              )}
              {phase === 'running' && (
                <>
                  <button className="btn btn-ghost" onClick={() => setPhase('paused')}>⏸ Pause</button>
                  <button className="btn btn-primary" onClick={() => setPhase('confirm')}>Done ✓</button>
                </>
              )}
              {phase === 'paused' && (
                <>
                  <button className="btn btn-primary" onClick={() => setPhase('running')}>▶ Resume</button>
                  <button className="btn btn-ghost" onClick={() => setPhase('confirm')}>Done</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setPhase('idle'); setElapsed(0) }}>
                    Cancel
                  </button>
                </>
              )}
            </div>

            {/* Max session notice */}
            {phase === 'running' && elapsed > 60 * 45 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 12 }}>
                Max session: {MAX_SESSION_MINUTES} min
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Practice tip */}
      {tip && phase === 'idle' && (
        <div style={{
          marginTop: 12,
          padding: '12px 16px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent-tag-border)',
          borderRadius: 8,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontFamily: 'sans-serif',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {tip}
          </p>
        </div>
      )}
    </>
  )
}
