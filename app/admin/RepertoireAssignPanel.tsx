'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useToast } from '@/lib/toast'

type Props = {
  studentId: string
  repertoire: any[]
  allSongs: any[]
  onUpdated: () => void
}

export default function RepertoireAssignPanel({ studentId, repertoire, allSongs, onUpdated }: Props) {
  const { toast } = useToast()
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const assignedIds = new Set(repertoire.map((r: any) => r.song.id))
  const unassigned = allSongs.filter((s: any) =>
    !assignedIds.has(s.id) &&
    (!search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.artist || '').toLowerCase().includes(search.toLowerCase()))
  )

  async function assign(songId: string) {
    setAssigning(songId)
    const res = await fetch('/api/repertoire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, song_id: songId }),
    })
    setAssigning(null)
    if (res.ok) { toast('Song added to repertoire'); onUpdated() }
    else toast('Failed to add', 'error')
  }

  async function remove(songId: string) {
    setRemoving(songId)
    const res = await fetch('/api/repertoire', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, song_id: songId }),
    })
    setRemoving(null)
    if (res.ok) { toast('Song removed from repertoire'); onUpdated() }
    else toast('Failed to remove', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Repertoire</h2>
          {repertoire.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{repertoire.length} songs</span>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setShowPicker(p => !p); setSearch('') }}
        >
          {showPicker ? '↑ Close' : '+ Add Song'}
        </button>
      </div>

      {/* Song picker */}
      {showPicker && (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <input
            autoFocus
            placeholder="Search song library…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          {allSongs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
              No songs in library yet.
            </div>
          ) : unassigned.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
              {search ? 'No songs match.' : 'All library songs already in repertoire.'}
            </div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unassigned.map((song: any) => (
                <div key={song.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {song.title}
                    </div>
                    {song.artist && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{song.artist}</div>}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                    disabled={assigning === song.id}
                    onClick={() => assign(song.id)}
                  >
                    {assigning === song.id ? '…' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Repertoire list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {repertoire.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No songs yet.</div>
        ) : (
          <>
            <div style={{
              maxHeight: repertoire.length > 8 ? '392px' : 'none',
              overflowY: repertoire.length > 8 ? 'auto' : 'visible',
              overscrollBehavior: 'contain',
            }}>
              {repertoire.map((item: any, i: number) => (
                <div key={item.song.id} style={{
                  padding: '10px 14px',
                  borderBottom: i < repertoire.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, wordBreak: 'break-word' }}>
                      {item.song.title}
                      {item.mastery_status === 'mastered' && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--green)' }}>✓</span>
                      )}
                    </div>
                    {item.song.artist && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{item.song.artist}</div>}
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                      {format(new Date(item.first_worked_on + 'T12:00:00'), 'MMM yyyy')}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '3px 7px', flexShrink: 0 }}
                    disabled={removing === item.song.id}
                    onClick={() => remove(item.song.id)}
                    title="Remove from repertoire"
                  >
                    {removing === item.song.id ? '…' : '✕'}
                  </button>
                </div>
              ))}
            </div>
            {repertoire.length > 8 && (
              <div style={{
                padding: '7px 14px', borderTop: '1px solid var(--border)',
                fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
                background: 'var(--bg-elevated)',
              }}>
                Scroll to see all {repertoire.length} songs
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
