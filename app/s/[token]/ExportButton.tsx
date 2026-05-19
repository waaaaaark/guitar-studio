'use client'

import { useState } from 'react'

type Props = {
  student: any
  lessons: any[]
  repertoire: any[]
}

export default function ExportButton({ student, lessons, repertoire }: Props) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const { exportStudentPDF } = await import('@/lib/exportPDF')
      await exportStudentPDF(student, lessons, repertoire)
    } catch (e) {
      alert('Export failed. Please try again.')
    }
    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '5px 12px',
        fontSize: 13,
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'sans-serif',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {exporting ? 'Exporting…' : '↓ Export PDF'}
    </button>
  )
}
