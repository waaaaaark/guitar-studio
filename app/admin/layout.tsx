'use client'

import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext<{ authed: boolean; setAuthed: (v: boolean) => void }>({
  authed: false, setAuthed: () => {}
})

export function useAuth() { return useContext(AuthContext) }

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setLoading(false)
    if (res.ok) { onLogin() }
    else { setError('Incorrect password'); setPw('') }
  }

  return (
    <div className="admin-sans" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ width: 320 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Guitar Studio
          </div>
          <div style={{ fontSize: 22, color: 'var(--text-primary)', marginTop: 6 }}>Admin</div>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              placeholder="Password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
              style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.15em' }}
            />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {loading ? 'Checking...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Try a quick auth check
    fetch('/api/students').then(r => {
      if (r.ok) setAuthed(true)
      setChecking(false)
    })
  }, [])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif', fontSize: 14 }}>Loading…</div>
    </div>
  )

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  return (
    <AuthContext.Provider value={{ authed, setAuthed }}>
      {children}
    </AuthContext.Provider>
  )
}
