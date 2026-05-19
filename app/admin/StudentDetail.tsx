'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, differenceInMonths } from 'date-fns'
import type { Student, Song } from '@/lib/supabase'
import StudentModal from './StudentModal'
import { ThemeToggle } from '@/lib/theme'

type Props = {
  student: Student
  onBack: () => void
  onStudentUpdated: (s: Student) => void
}

export default function StudentDetail({ student: initialStudent, onBack, onStudentUpdated }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [allSongs, setAllSongs] = useState<Song[]>([])

  const load = useCallback(async () => {
    const [sRes, songsRes] = await Promise.all([
      fetch(`/api/students/${initialStudent.id}`),
      fetch('/api/songs'),
    ])
    setData(await sRes.json())
    setAllSongs(await songsRes.json())
    setLoading(false)
  }, [initialStudent.id])

  useEffect(() => { load() }, [load])

  async function toggleActive() {
    const newActive = !data.student.active
    const body: any = { active: newActive }
    if (!newActive) body.inactive_date = new Date().toISOString().split('T')[0]
    else body.inactive_date = null
    const res = await fetch(`/api/students/${data.student.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { onStudentUpdated(await res.json()); load() }
  }

  async function deleteStudent() {
    if (!confirm(`Delete ${data?.student.name}? This cannot be undone.`)) return
    await fetch(`/api/students/${data.student.id}`, { method: 'DELETE' })
    onBack()
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson?')) return
    await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' })
    load()
  }

  async function sendEmail(lessonId: string) {
    const res = await fetch('/api/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId }),
    })
    if (res.ok) alert('Email sent!')
    else { const d = await res.json(); alert('Error: ' + d.error) }
  }

  const student = data?.student || initialStudent
  const tenure = differenceInMonths(new Date(), new Date(student.start_date + 'T12:00:00'))

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>← Students</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.name}
          </span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
        {/* Student header */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{student.name}</h1>
                <span className={`tag ${student.active ? 'tag-active' : 'tag-inactive'}`}>
                  {student.active ? 'Active' : 'Inactive'}
                </span>
                <span className="tag tag-skill">{student.skill_level}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '3px 14px' }}>
                {student.email && <span>✉ {student.email}</span>}
                <span>{student.lesson_frequency}</span>
                <span>Since {format(new Date(student.start_date + 'T12:00:00'), 'MMMM d, yyyy')}</span>
                {tenure > 0 && <span>{tenure}mo</span>}
                <span>{student.lesson_count} lesson{student.lesson_count !== 1 ? 's' : ''}</span>
              </div>
              {student.admin_notes && (
                <div style={{
                  marginTop: 12, padding: '9px 13px',
                  background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6,
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes · </span>
                  {student.admin_notes}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(true)}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={toggleActive}>
                {student.active ? 'Deactivate' : 'Reactivate'}
              </button>
              <a href={`/s/${student.token}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                Page ↗
              </a>
              <button className="btn btn-danger btn-sm" onClick={deleteStudent}>Delete</button>
            </div>
          </div>
        </div>

        {/* Two-column on desktop, stacked on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20, alignItems: 'start' }}
          className="mobile-stack">

          {/* Lessons */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Lessons</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddLesson(true)}>+ Log Lesson</button>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
            ) : !data?.lessons?.length ? (
              <div className="card" style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
                No lessons logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.lessons.map((lesson: any, i: number) => (
                  <div key={lesson.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                          {format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')}
                        </span>
                        {i === 0 && <span className="tag tag-active" style={{ fontSize: 11 }}>Latest</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {student.email && (
                          <button className="btn btn-ghost btn-sm" onClick={() => sendEmail(lesson.id)}>✉</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteLesson(lesson.id)}>Delete</button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>What we covered</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lesson.what_we_covered}</p>
                    </div>
                    <div style={{ marginBottom: lesson.lesson_songs?.length ? 10 : 0 }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>Focus for the week</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lesson.focus_for_week}</p>
                    </div>
                    {lesson.lesson_songs?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>Songs</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {lesson.lesson_songs.map((ls: any) => (
                            <span key={ls.song.id} className="tag tag-skill" style={{ fontSize: 12 }}>
                              {ls.song.title}{ls.song.artist ? ` — ${ls.song.artist}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repertoire sidebar */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Repertoire</h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {!data?.repertoire?.length ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No songs yet.</div>
              ) : data.repertoire.map((item: any, i: number) => (
                <div key={item.song.id} style={{
                  padding: '11px 14px',
                  borderBottom: i < data.repertoire.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.song.title}</div>
                  {item.song.artist && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{item.song.artist}</div>}
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>
                    {format(new Date(item.first_worked_on + 'T12:00:00'), 'MMM yyyy')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showEditModal && (
        <StudentModal student={student} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); load() }} />
      )}
      {showAddLesson && (
        <AddLessonModal
          studentId={student.id}
          allSongs={allSongs}
          onClose={() => setShowAddLesson(false)}
          onSaved={() => { setShowAddLesson(false); load() }}
        />
      )}
    </div>
  )
}

function AddLessonModal({ studentId, allSongs, onClose, onSaved }: {
  studentId: string; allSongs: Song[]; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    lesson_date: new Date().toISOString().split('T')[0],
    what_we_covered: '', focus_for_week: '',
  })
  const [selected, setSelected] = useState<string[]>([])
  const [songSearch, setSongSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [localSongs, setLocalSongs] = useState<Song[]>(allSongs)

  const filtered = localSongs.filter(s =>
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    (s.artist || '').toLowerCase().includes(songSearch.toLowerCase())
  )

  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function addSong() {
    if (!newTitle.trim()) return
    const res = await fetch('/api/songs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), artist: newArtist.trim() || null }),
    })
    if (res.ok) {
      const song = await res.json()
      setLocalSongs(p => [...p, song].sort((a, b) => a.title.localeCompare(b.title)))
      setSelected(p => [...p, song.id])
      setNewTitle(''); setNewArtist('')
    }
  }

  async function save() {
    if (!form.what_we_covered.trim() || !form.focus_for_week.trim()) {
      setError('Please fill in both lesson fields'); return
    }
    setSaving(true); setError('')
    const res = await fetch('/api/lessons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, student_id: studentId, song_ids: selected }),
    })
    setSaving(false)
    if (res.ok) onSaved()
    else { const d = await res.json(); setError(d.error || 'Error') }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card admin-sans" style={{ width: '100%', maxWidth: 560, padding: 24, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Log Lesson</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Date</label>
            <input type="date" value={form.lesson_date} onChange={e => setForm(f => ({ ...f, lesson_date: e.target.value }))} />
          </div>
          <div>
            <label>What we covered *</label>
            <textarea value={form.what_we_covered} onChange={e => setForm(f => ({ ...f, what_we_covered: e.target.value }))}
              placeholder="Describe what you worked on…" style={{ minHeight: 90 }} />
          </div>
          <div>
            <label>Focus for the week *</label>
            <textarea value={form.focus_for_week} onChange={e => setForm(f => ({ ...f, focus_for_week: e.target.value }))}
              placeholder="What should they practice this week?" style={{ minHeight: 70 }} />
          </div>

          <div>
            <label>Songs worked on</label>
            <input placeholder="Search songs…" value={songSearch} onChange={e => setSongSearch(e.target.value)} style={{ marginBottom: 6 }} />
            <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
              {filtered.map(song => (
                <div key={song.id} onClick={() => toggle(song.id)} style={{
                  padding: '9px 13px', cursor: 'pointer',
                  background: selected.includes(song.id) ? 'var(--accent-glow)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: selected.includes(song.id) ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 14 }}>
                    {song.title}{song.artist ? ` — ${song.artist}` : ''}
                  </span>
                  {selected.includes(song.id) && <span style={{ color: 'var(--accent)', fontSize: 13 }}>✓</span>}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '10px 13px', color: 'var(--text-muted)', fontSize: 13 }}>No songs match.</div>
              )}
            </div>

            {/* Add new song */}
            <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Add new song to library</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ flex: '2 1 120px' }} />
                <input placeholder="Artist (optional)" value={newArtist} onChange={e => setNewArtist(e.target.value)} style={{ flex: '2 1 120px' }} />
                <button className="btn btn-ghost btn-sm" onClick={addSong} style={{ flexShrink: 0 }}>Add</button>
              </div>
            </div>

            {selected.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selected.map(id => {
                  const song = localSongs.find(s => s.id === id)
                  return song ? (
                    <span key={id} className="tag tag-skill" style={{ fontSize: 12 }}>
                      {song.title}
                      <span onClick={() => toggle(id)} style={{ cursor: 'pointer', marginLeft: 5 }}>×</span>
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Log lesson'}
          </button>
        </div>
      </div>
    </div>
  )
}
