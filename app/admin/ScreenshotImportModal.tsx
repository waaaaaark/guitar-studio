'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/lib/toast'

type Props = {
  existingSongs: any[]
  onClose: () => void
  onImported: () => void
}

type Step = 'upload' | 'review' | 'done'

function normTitle(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
}

function isExisting(song: { title: string; artist: string }, existing: any[]) {
  const t = normTitle(song.title)
  const a = normTitle(song.artist || '')
  return existing.some(e => normTitle(e.title) === t && normTitle(e.artist || '') === a)
}

export default function ScreenshotImportModal({ existingSongs, onClose, onImported }: Props) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [songs, setSongs] = useState<{ title: string; artist: string }[]>([])
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return
    setFiles(Array.from(newFiles).filter(f => f.type.startsWith('image/')))
  }

  async function parse() {
    if (!files.length) return
    setParsing(true)

    const fd = new FormData()
    files.forEach(f => fd.append('files', f))

    const res = await fetch('/api/songs/screenshot', { method: 'POST', body: fd })
    const data = await res.json()
    setParsing(false)

    if (!res.ok) { toast(data.error || 'Parse failed', 'error'); return }

    const parsed: { title: string; artist: string }[] = data.songs || []

    // Mark which extracted songs already exist in the library
    const dups = new Set<number>()
    parsed.forEach((s, i) => { if (isExisting(s, existingSongs)) dups.add(i) })

    setSongs(parsed)
    setDuplicateIndices(dups)
    // Pre-select only new songs; duplicates start deselected
    setSelected(new Set(parsed.map((_, i) => i).filter(i => !dups.has(i))))
    setStep('review')
  }

  function toggle(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === songs.length) setSelected(new Set())
    else setSelected(new Set(songs.map((_, i) => i)))
  }

  async function doImport() {
    const toImport = songs.filter((_, i) => selected.has(i))
    if (!toImport.length) return
    setImporting(true)

    let imported = 0
    let skipped = 0

    for (const song of toImport) {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: song.title, artist: song.artist || null }),
      })
      if (res.ok) imported++
      else skipped++
    }

    setImporting(false)
    setResult({ imported, skipped })
    setStep('done')
    toast(`Imported ${imported} song${imported !== 1 ? 's' : ''}`)
  }

  const dupCount = duplicateIndices.size

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            Import from Ultimate Guitar
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {step === 'upload' && 'Upload screenshots of your UG library — AI reads each one'}
          {step === 'review' && `${songs.length} songs found — select which to import`}
          {step === 'done' && 'Import complete'}
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div>
            <div style={{
              padding: 14, background: 'var(--bg-elevated)', borderRadius: 8,
              border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.6, marginBottom: 16,
            }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Tips for best results:</strong>
              • Use the list view in the UG app (not grid)<br />
              • 10–20 songs per screenshot works best<br />
              • Make sure titles and artists are clearly visible<br />
              • You can upload multiple screenshots at once
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />

            <button
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: 14, marginBottom: 12 }}
              onClick={() => fileRef.current?.click()}
            >
              {files.length ? `✓ ${files.length} screenshot${files.length !== 1 ? 's' : ''} selected` : '↑ Choose screenshots…'}
            </button>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {files.map((f, i) => (
                  <span key={i} style={{
                    fontSize: 12, padding: '3px 10px', borderRadius: 20,
                    background: 'var(--accent-tag-bg)', color: 'var(--accent)',
                    border: '1px solid var(--accent-tag-border)',
                  }}>
                    {f.name.length > 24 ? f.name.slice(0, 21) + '…' : f.name}
                  </span>
                ))}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 12 }}
              onClick={parse}
              disabled={!files.length || parsing}
            >
              {parsing ? 'Reading screenshots…' : 'Read screenshots →'}
            </button>

            {parsing && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Sending to AI… this takes a few seconds per screenshot
              </div>
            )}
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div>
            {songs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                No songs could be read from the screenshots. Try clearer images.
              </div>
            ) : (
              <>
                {dupCount > 0 && (
                  <div style={{
                    marginBottom: 12, padding: '8px 12px', borderRadius: 6, fontSize: 13,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}>
                    {dupCount} already in your library — deselected
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {selected.size} of {songs.length} selected
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
                    {selected.size === songs.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20 }}>
                  {songs.map((song, i) => {
                    const isDup = duplicateIndices.has(i)
                    return (
                      <div
                        key={i}
                        onClick={() => toggle(i)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                          cursor: 'pointer', borderBottom: i < songs.length - 1 ? '1px solid var(--border)' : 'none',
                          background: selected.has(i) ? 'var(--accent-glow)' : 'transparent',
                          opacity: isDup && !selected.has(i) ? 0.5 : 1,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${selected.has(i) ? 'var(--accent)' : 'var(--border-light)'}`,
                          background: selected.has(i) ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected.has(i) && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>{song.title}</div>
                          {song.artist && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>{song.artist}</div>
                          )}
                        </div>
                        {isDup && (
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                            background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}>
                            in library
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setStep('upload')}>← Back</button>
                  <button
                    className="btn btn-primary"
                    onClick={doImport}
                    disabled={selected.size === 0 || importing}
                  >
                    {importing ? 'Importing…' : `Import ${selected.size} song${selected.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && result && (
          <div>
            <div style={{
              background: 'rgba(61,122,82,0.08)', border: '1px solid rgba(61,122,82,0.25)',
              borderRadius: 8, padding: 20, textAlign: 'center', marginBottom: 20,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎸</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {result.imported} song{result.imported !== 1 ? 's' : ''} added
              </div>
              {dupCount > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {dupCount} already in library — skipped
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onImported}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
