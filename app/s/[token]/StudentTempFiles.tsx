'use client'

import { useState, useEffect } from 'react'

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
}

function fileIcon(type: string | null) {
  if (!type) return '📎'
  if (FILE_ICONS[type]) return FILE_ICONS[type]
  if (type.startsWith('image/')) return '🖼'
  return '📎'
}

type StudentFile = {
  id: string
  file_name: string
  file_size: number | null
  file_type: string | null
  created_at: string
  url: string | null
}

export default function StudentTempFiles({ token }: { token: string }) {
  const [files, setFiles] = useState<StudentFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/student-files?token=${token}`)
      .then(r => r.json())
      .then(d => { setFiles(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (loading || files.length === 0) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, fontFamily: 'sans-serif' }}>
        From Your Teacher
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {files.map(f => (
          <a
            key={f.id}
            href={f.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              textDecoration: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-dim)'
              e.currentTarget.style.boxShadow = '0 2px 8px var(--accent-glow)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {fileIcon(f.file_type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'var(--text-primary)', fontWeight: 500, fontSize: 15,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {f.file_name}
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>↗</div>
          </a>
        ))}
      </div>
    </div>
  )
}
