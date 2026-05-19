'use client'

import { useState, useEffect } from 'react'

type Props = { onBack: () => void }

export default function SongsLibrary({ onBack }: Props) {
  const [songs, setSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/songs')
    const data = await res.json()
    setSongs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)', padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 16, height: 56,
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
      }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Students</button>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Song Library</span>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
            Song Library
            <span style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 400, marginLeft: 10 }}>
              {songs.length} songs
            </span>
          </h1>
        </div>

        <input
          placeholder="Search by title or artist…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No songs found.</div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {filtered.map((song, i) => {
              const studentCount = song.student_songs?.length || 0
              const isExpanded = expanded === song.id
              return (
                <div key={song.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    onClick={() => setExpanded(isExpanded ? null : song.id)}
                    style={{
                      padding: '14px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: studentCount > 0 ? 'pointer' : 'default',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 15 }}>{song.title}</span>
                      {song.artist && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: 10, fontSize: 14 }}>{song.artist}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {studentCount} student{studentCount !== 1 ? 's' : ''}
                      </span>
                      {studentCount > 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{isExpanded ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </div>
                  {isExpanded && studentCount > 0 && (
                    <div style={{ padding: '0 20px 16px', background: 'var(--bg)' }}>
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
