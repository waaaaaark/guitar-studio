'use client'

import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { useToast } from '@/lib/toast'
// Inline to avoid any proxy issues
const RESOURCE_TYPES = ['PDF', 'Video', 'Article', 'Chord Chart', 'Exercise', 'Backing Track', 'Other'] as const
type ResourceType = typeof RESOURCE_TYPES[number]
const RESOURCE_ICONS: Record<string, string> = {
  PDF: '📄', Video: '🎬', Article: '📰',
  'Chord Chart': '🎸', Exercise: '🏋️', 'Backing Track': '🎵', Other: '📎',
}
import { format } from 'date-fns'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function ResourcesLibrary({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/resources')
    setResources(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteResource(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes it from all students too.`)) return
    const res = await fetch('/api/resources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast('Resource deleted'); load() }
    else toast('Delete failed', 'error')
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch('/api/resources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    toast(active ? 'Resource hidden' : 'Resource active')
    load()
  }

  const filtered = resources.filter(r => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
    const matchType = filterType === 'All' || r.resource_type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm">← Back</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Resources</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Resource Library</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {resources.filter(r => r.active).length} active · assign to students from their profile
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Resource
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ width: 'auto', flexShrink: 0 }}
          >
            <option value="All">All types</option>
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>{RESOURCE_ICONS[t]} {t}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No resources found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(resource => {
              const assignCount = resource.student_resources?.length || 0
              const isExpanded = expandedId === resource.id

              return (
                <div key={resource.id} className="card" style={{ overflow: 'visible', opacity: resource.active ? 1 : 0.55 }}>
                  <div style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {RESOURCE_ICONS[resource.resource_type as ResourceType]}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>
                          {resource.title}
                        </span>
                        <span style={{
                          fontSize: 11, padding: '1px 8px', borderRadius: 20,
                          background: 'var(--accent-tag-bg)', color: 'var(--accent)',
                          border: '1px solid var(--accent-tag-border)',
                        }}>
                          {resource.resource_type}
                        </span>
                        {resource.source_type === 'upload' && (
                          <span style={{
                            fontSize: 11, padding: '1px 8px', borderRadius: 20,
                            background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}>
                            ↑ Uploaded{resource.file_size ? ` · ${formatBytes(resource.file_size)}` : ''}
                          </span>
                        )}
                        {!resource.active && (
                          <span className="tag tag-inactive">Hidden</span>
                        )}
                      </div>
                      {resource.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                          {resource.description}
                        </p>
                      )}
                      {resource.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {resource.tags.map((tag: string) => (
                            <span key={tag} style={{
                              fontSize: 11, padding: '1px 8px', borderRadius: 20,
                              background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                            }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {assignCount} student{assignCount !== 1 ? 's' : ''} assigned ·{' '}
                        {format(new Date(resource.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap' }}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 10px' }}
                      >↗</a>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleActive(resource.id, resource.active)}
                        style={{ padding: '4px 10px' }}
                      >
                        {resource.active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteResource(resource.id, resource.title)}
                        style={{ padding: '4px 10px' }}
                      >✕</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddResourceModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); load(); toast('Resource added') }}
        />
      )}
    </div>
  )
}

function AddResourceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [sourceType, setSourceType] = useState<'link' | 'upload'>('link')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceType, setResourceType] = useState<ResourceType>('Other')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase()
    if (clean && !tags.includes(clean)) setTags(p => [...p, clean])
    setTagInput('')
  }

  async function save() {
    if (!title.trim()) { setError('Title is required'); return }
    if (sourceType === 'link' && !url.trim()) { setError('URL is required'); return }
    if (sourceType === 'upload' && !file) { setError('Please select a file'); return }

    setSaving(true); setError('')

    if (sourceType === 'link') {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, resource_type: resourceType, url, tags }),
      })
      setSaving(false)
      if (res.ok) onSaved()
      else { const d = await res.json(); setError(d.error || 'Error') }
    } else {
      const fd = new FormData()
      fd.append('file', file!)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('resource_type', resourceType)
      fd.append('tags', JSON.stringify(tags))

      const res = await fetch('/api/resources/upload', { method: 'POST', body: fd })
      setSaving(false)
      if (res.ok) onSaved()
      else { const d = await res.json(); setError(d.error || 'Upload failed') }
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 500, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Add Resource</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Source type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['link', 'upload'] as const).map(t => (
            <button key={t} onClick={() => setSourceType(t)} style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
              background: sourceType === t ? 'var(--accent)' : 'var(--bg-elevated)',
              color: sourceType === t ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${sourceType === t ? 'var(--accent)' : 'var(--border)'}`,
              fontFamily: 'inherit', fontSize: 14, fontWeight: sourceType === t ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {t === 'link' ? '🔗 Link' : '↑ Upload File'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource title" autoFocus />
          </div>
          <div>
            <label>Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this resource…" style={{ minHeight: 70 }} />
          </div>
          <div>
            <label>Type</label>
            <select value={resourceType} onChange={e => setResourceType(e.target.value as ResourceType)}>
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{RESOURCE_ICONS[t]} {t}</option>)}
            </select>
          </div>

          {sourceType === 'link' ? (
            <div>
              <label>URL *</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          ) : (
            <div>
              <label>File *</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.mp3,.mp4,.wav,.m4a,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => fileRef.current?.click()}
              >
                {file ? `✓ ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)` : 'Choose file…'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                PDF, images, audio, Word docs — max 50MB
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label>Tags (optional)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tagInput) { e.preventDefault(); addTag(tagInput) } }}
                placeholder="e.g. beginner, strumming…"
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
                Add
              </button>
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

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? (sourceType === 'upload' ? 'Uploading…' : 'Saving…') : 'Add resource'}
          </button>
        </div>
      </div>
    </div>
  )
}
