'use client'

import { useState, useEffect, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { useToast } from '@/lib/toast'

type StudentFile = {
  id: string
  file_name: string
  file_size: number | null
  file_type: string | null
  created_at: string
  expires_at: string
  url: string | null
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string | null) {
  if (!type) return '📎'
  if (type === 'application/pdf') return '📄'
  if (type.startsWith('image/')) return '🖼'
  return '📎'
}

export default function StudentFilesPanel({ studentId }: { studentId: string }) {
  const { toast } = useToast()
  const [files, setFiles] = useState<StudentFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/students/${studentId}/files`)
    if (res.ok) setFiles(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [studentId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/students/${studentId}/files`, { method: 'POST', body: form })
    if (res.ok) {
      toast('File uploaded')
      load()
    } else {
      const d = await res.json()
      toast(d.error || 'Upload failed', 'error')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function deleteFile(fileId: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    const res = await fetch(`/api/students/${studentId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    })
    if (res.ok) { toast('File deleted'); load() }
    else toast('Delete failed', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Temp Files</h2>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Screenshots & PDFs · auto-deleted after 7 days</div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : '+ Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : !files.length ? (
        <div className="card" style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
          No files uploaded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(f => {
            const daysLeft = differenceInDays(new Date(f.expires_at), new Date())
            const expiringSoon = daysLeft <= 2
            return (
              <div key={f.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(f.file_type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {f.file_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                    {f.file_size && <span>{formatBytes(f.file_size)}</span>}
                    <span>{format(new Date(f.created_at), 'MMM d')}</span>
                    <span style={{ color: expiringSoon ? 'var(--red)' : 'var(--text-muted)' }}>
                      {daysLeft <= 0 ? 'Expiring today' : `${daysLeft}d left`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 10px' }}
                    >
                      ↗
                    </a>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '4px 10px' }}
                    onClick={() => deleteFile(f.id, f.file_name)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
