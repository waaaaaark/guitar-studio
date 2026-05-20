'use client'

import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { useToast } from '@/lib/toast'

export default function SongsLibrary({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [songs, setSongs] = useState<any[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])

  async function load() {
    const [songsRes, tagsRes] = await Promise.all([
      fetch('/api/songs'),
      fetch('/api/songs/tags'),
    ])
    setSongs(await songsRes.json())
    setAllTags(await tagsRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  async function addTag(songId: string, tag: string) {
    if (!tag.trim()) return
    const res = await fetch('/api/songs/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId, tag }),
    })
    if (res.ok) {
      toast('Tag added')
      load()
      setAddingTagFor(null)
      setTagInput('')
    }
  }

  async function removeTag(songId: string, tag: string) {
    await fetch('/api/songs/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId, tag }),
    })
    toast('Tag removed')
    load()
  }

  function handleTagInput(val: string) {
    setTagInput(val)
    if (val.trim()) {
      setTagSuggestions(allTags.filter(t => t.includes(val.toLowerCase()) && t !== val.toLowerCase()))
    } else {
      setTagSuggestions([])
    }
  }

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Song Library <span style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 400 }}>({songs.length})</span>
          </h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add Song</button>
        </div>

        <input
          placeholder="Search by title, artist, or tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No songs found.</div>
        ) : (
          <div className="card" style={{ overflow: 'visible' }}>
            {filtered.map((song, i) => {
              const count = song.student_songs?.length || 0
              const isOpen = expanded === song.id
              return (
                <div key={song.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding: '13px 18px' }}>
                    {/* Song title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 500 }}>{song.title}</span>
                          {song.artist && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{song.artist}</span>}
                        </div>
                        {/* Tags */}
                        {song.tags?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                            {song.tags.map((tag: string) => (
                              <span key={tag} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 9px', borderRadius: 20, fontSize: 11,
                                background: 'var(--accent-tag-bg)', color: 'var(--accent)',
                                border: '1px solid var(--accent-tag-border)',
                              }}>
                                {tag}
                                <span
                                  onClick={() => removeTag(song.id, tag)}
                                  style={{ cursor: 'pointer', opacity: 0.6, fontSize: 12, lineHeight: 1 }}
                                >×</span>
                              </span>
                            ))}
                            <button
                              onClick={() => { setAddingTagFor(addingTagFor === song.id ? null : song.id); setTagInput(''); setTagSuggestions([]) }}
                              style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >+ tag</button>
                          </div>
                        )}
                        {(!song.tags || song.tags.length === 0) && (
                          <button
                            onClick={() => { setAddingTagFor(addingTagFor === song.id ? null : song.id); setTagInput(''); setTagSuggestions([]) }}
                            style={{ marginTop: 5, padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >+ add tag</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{count} student{count !== 1 ? 's' : ''}</span>
                        {count > 0 && (
                          <button onClick={() => setExpanded(isOpen ? null : song.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
                            {isOpen ? '↑' : '↓'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tag input */}
                    {addingTagFor === song.id && (
                      <div style={{ marginTop: 10, position: 'relative', zIndex: 20 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            autoFocus
                            placeholder="e.g. fingerpicking, strumming pattern…"
                            value={tagInput}
                            onChange={e => handleTagInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTag(song.id, tagInput) }}
                            style={{ flex: 1, fontSize: 13 }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => addTag(song.id, tagInput)}>Add</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setAddingTagFor(null); setTagInput('') }}>✕</button>
                        </div>
                        {tagSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 60,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 6, zIndex: 10, marginTop: 2, overflow: 'hidden',
                          }}>
                            {tagSuggestions.map(s => (
                              <div key={s} onClick={() => { addTag(song.id, s) }}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >{s}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Student cross-ref */}
                  {isOpen && count > 0 && (
                    <div style={{ padding: '0 18px 14px', background: 'var(--bg-elevated)' }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Worked on with
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {song.student_songs.map((ss: any) => (
                          <span key={ss.student_id} className={`tag ${ss.student?.active ? 'tag-skill' : 'tag-inactive'}`}>
                            {ss.student?.name?.replace(/__test__/g, '').trim() || 'Unknown'}
                            {ss.mastery_status === 'mastered' && ' ✓'}
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

      {showAddModal && (
        <AddSongModal
          allTags={allTags}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); load(); toast('Song added') }}
        />
      )}
    </div>
  )
}

function AddSongModal({ allTags, onClose, onSaved }: { allTags: string[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTagInput(val: string) {
    setTagInput(val)
    setSuggestions(val.trim() ? allTags.filter(t => t.includes(val.toLowerCase()) && !tags.includes(t)) : [])
  }

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase()
    if (clean && !tags.includes(clean)) setTags(p => [...p, clean])
    setTagInput('')
    setSuggestions([])
  }

  async function save() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    const res = await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), artist: artist.trim() || null, tags }),
    })
    setSaving(false)
    if (res.ok) onSaved()
    else { const d = await res.json(); setError(d.error || 'Error') }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Add Song</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Song title" autoFocus />
          </div>
          <div>
            <label>Artist (optional)</label>
            <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist or composer" />
          </div>
          <div>
            <label>Tags (optional)</label>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={tagInput}
                  onChange={e => handleTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && tagInput) addTag(tagInput) }}
                  placeholder="e.g. fingerpicking, blues…"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Add</button>
              </div>
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 60,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 6, zIndex: 10, marginTop: 2, overflow: 'hidden',
                }}>
                  {suggestions.map(s => (
                    <div key={s} onClick={() => addTag(s)}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{s}</div>
                  ))}
                </div>
              )}
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {tags.map(t => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20, fontSize: 12,
                    background: 'var(--accent-tag-bg)', color: 'var(--accent)',
                    border: '1px solid var(--accent-tag-border)',
                  }}>
                    {t}
                    <span onClick={() => setTags(p => p.filter(x => x !== t))} style={{ cursor: 'pointer', opacity: 0.7 }}>×</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Add song'}
          </button>
        </div>
      </div>
    </div>
  )
}
