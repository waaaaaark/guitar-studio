'use client'

import { useState, useRef } from 'react'

type Step = 'upload' | 'review' | 'done'

type Props = {
  onClose: () => void
  onImported: () => void
}

export default function ImportModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [names, setNames] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<{ imported: number; skipped: number; skippedNames: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(f: File) {
    setFile(f)
    setLoading(true)
    setError('')

    const fd = new FormData()
    fd.append('action', 'parse')
    fd.append('file', f)

    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Failed to parse file'); return }

    setSheetNames(data.sheetNames || [])
    setSheetName(data.brendanSheet || '')
    setNames(data.names || [])
    setSelected(new Set(data.names || []))
    setStep('review')
  }

  async function handleSheetChange(name: string) {
    if (!file) return
    setSheetName(name)
    setLoading(true)

    const fd = new FormData()
    fd.append('action', 'parse_sheet')
    fd.append('file', file)
    fd.append('sheetName', name)

    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setNames(data.names || [])
      setSelected(new Set(data.names || []))
    }
  }

  async function doImport() {
    setLoading(true)
    setError('')

    const fd = new FormData()
    fd.append('action', 'import')
    fd.append('names', JSON.stringify(Array.from(selected)))

    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Import failed'); return }
    setResult(data)
    setStep('done')
  }

  function toggleAll() {
    if (selected.size === names.length) setSelected(new Set())
    else setSelected(new Set(names))
  }

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Import from Google Sheets</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {step === 'upload' && 'Upload your exported .xlsx file'}
              {step === 'review' && `${names.length} students found — select who to import`}
              {step === 'done' && 'Import complete'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(184,76,62,0.1)', border: '1px solid var(--red)', borderRadius: 6, padding: '10px 14px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div>
            <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>How to export from Google Sheets:</strong>
              File → Download → Microsoft Excel (.xlsx)
              <br />The app will automatically find your tab and extract student names.
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}
              onClick={() => fileRef.current?.click()}
              disabled={loading}
            >
              {loading ? 'Reading file…' : '↑ Choose .xlsx file'}
            </button>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div>
            {/* Sheet picker */}
            {sheetNames.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <label>Sheet tab</label>
                <select value={sheetName} onChange={e => handleSheetChange(e.target.value)}>
                  {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}

            {sheetName && (
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Reading from: <strong style={{ color: 'var(--text-primary)' }}>{sheetName}</strong>
              </div>
            )}

            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '16px 0' }}>Parsing…</div>
            ) : names.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No student names found in this sheet.</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {selected.size} of {names.length} selected
                  </span>
                  <button onClick={toggleAll} className="btn btn-ghost btn-sm">
                    {selected.size === names.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <div style={{
                  maxHeight: 280, overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: 8,
                  marginBottom: 20,
                }}>
                  {names.map((name, i) => (
                    <div
                      key={name}
                      onClick={() => toggle(name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', cursor: 'pointer',
                        borderBottom: i < names.length - 1 ? '1px solid var(--border)' : 'none',
                        background: selected.has(name) ? 'var(--accent-glow)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${selected.has(name) ? 'var(--accent)' : 'var(--border-light)'}`,
                        background: selected.has(name) ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.1s',
                      }}>
                        {selected.has(name) && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{name}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setStep('upload')}>← Back</button>
                  <button
                    className="btn btn-primary"
                    onClick={doImport}
                    disabled={selected.size === 0 || loading}
                  >
                    {loading ? 'Importing…' : `Import ${selected.size} student${selected.size !== 1 ? 's' : ''}`}
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
              borderRadius: 8, padding: 20, marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {result.imported} student{result.imported !== 1 ? 's' : ''} imported
              </div>
              {result.skipped > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {result.skipped} skipped (already exist): {result.skippedNames.join(', ')}
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onImported}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
