'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/lib/theme'

export default function SongsLibrary({ onBack }: { onBack: () => void }) {
  const [songs, setSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/songs').then(r => r.json()).then(d => { setSongs(d); setLoading(false) })
  }, [])

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm">← Students</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Song Library</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Song Library <span style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 400 }}>({songs.length})</span>
          </h1>
        </div>

        <input placeholder="Search by title or artist…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No songs found.</div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {filtered.map((song, i) => {
              const count = song.student_songs?.length || 0
              const isOpen = expanded === song.id
              return (
                <div key={song.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    onClick={() => count > 0 && setExpanded(isOpen ? null : song.id)}
                    style={{
                      padding: '13px 18px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: count > 0 ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (count > 0) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 15 }}>{song.title}</span>
                      {song.artist && <span style={{ color: 'var(--text-muted)', marginLeft: 10, fontSize: 14 }}>{song.artist}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{count} student{count !== 1 ? 's' : ''}</span>
                      {count > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{isOpen ? '↑' : '↓'}</span>}
                    </div>
                  </div>
                  {isOpen && count > 0 && (
                    <div style={{ padding: '0 18px 14px', background: 'var(--bg-elevated)' }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Worked on with
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {song.student_songs.map((ss: any) => (
                          <span key={ss.student_id} className={`tag ${ss.student?.active ? 'tag-skill' : 'tag-inactive'}`}>
                            {ss.student?.name || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
