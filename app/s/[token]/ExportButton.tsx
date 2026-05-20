'use client'

import { useState } from 'react'
import type { ExportMode } from '@/lib/exportPDF'

type Props = {
  student: any
  lessons: any[]
  repertoire: any[]
}

export default function ExportButton({ student, lessons, repertoire }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<ExportMode>('both')
  const [exporting, setExporting] = useState(false)

  async function doExport() {
    setExporting(true)
    try {
      const { exportStudentPDF } = await import('@/lib/exportPDF')
      await exportStudentPDF(student, lessons, repertoire, mode)
    } catch (e) {
      console.error('Export failed:', e)
      alert('Export failed. Please try again.')
    }
    setExporting(false)
    setShowModal(false)
  }

  const options: { value: ExportMode; label: string; desc: string }[] = [
    { value: 'songs', label: 'Song List', desc: 'Two-column list of all songs, with mastered marked ✓' },
    { value: 'lessons', label: 'Lesson Notes', desc: 'All lessons — date, what we covered, focus, songs' },
    { value: 'both', label: 'Both', desc: 'Song list on page 1, lesson notes starting page 2' },
  ]

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 6, padding: '5px 12px', fontSize: 13,
          color: 'var(--text-muted)', cursor: 'pointer',
          fontFamily: 'sans-serif', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        ↓ Export
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="card" style={{ width: '100%', maxWidth: 380, padding: 24, fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Export PDF</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: mode === opt.value ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                    border: `1px solid ${mode === opt.value ? 'var(--accent-tag-border)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: mode === opt.value ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 3 }}>
                    {mode === opt.value ? '● ' : '○ '}{opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Print-optimized — minimal ink, clean layout, no decorative borders.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={doExport} disabled={exporting}>
                {exporting ? 'Generating…' : '↓ Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
