'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, differenceInMonths } from 'date-fns'
import type { Student, Song } from '@/lib/supabase'
import StudentModal from './StudentModal'
import { ThemeToggle } from '@/lib/theme'
import { useToast } from '@/lib/toast'
import BeltPanel from './BeltPanel'
import ResourceAssignPanel from './ResourceAssignPanel'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

type Props = {
  student: Student
  onBack: () => void
  onStudentUpdated: (s: Student) => void
}

export default function StudentDetail({ student: initialStudent, onBack, onStudentUpdated }: Props) {
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [exporting, setExporting] = useState(false)
  const [showAllLessons, setShowAllLessons] = useState(false)
  const LESSONS_INITIAL = 3

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
    const body: any = { active: newActive, inactive_date: newActive ? null : new Date().toISOString().split('T')[0] }
    const res = await fetch(`/api/students/${data.student.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      onStudentUpdated(updated)
      load()
      toast(newActive ? 'Student reactivated' : 'Student marked inactive')
    }
  }

  async function deleteStudent() {
    if (!confirm(`Delete ${data?.student.name}? This cannot be undone.`)) return
    await fetch(`/api/students/${data.student.id}`, { method: 'DELETE' })
    toast('Student deleted')
    onBack()
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson?')) return
    await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' })
    toast('Lesson deleted')
    load()
  }

  async function sendOnboardingEmail() {
    if (!student.email) { toast('No email on file for this student', 'error'); return }
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id }),
    })
    if (res.ok) toast('Onboarding email sent to ' + student.email)
    else { const d = await res.json(); toast('Failed: ' + (d.error || 'Unknown error'), 'error') }
  }

  async function exportPDF() {
    if (!data) return
    setExporting(true)
    try {
      const { exportStudentPDF } = await import('@/lib/exportPDF')
      await exportStudentPDF(data.student, data.lessons, data.repertoire)
      toast('PDF downloaded')
    } catch (e) {
      toast('Export failed', 'error')
    }
    setExporting(false)
  }

  const student = data?.student || initialStudent
  const tenure = differenceInMonths(new Date(), new Date(student.start_date + 'T12:00:00'))
  const displayName = student.name.replace('__test__', '').trim()

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>← Back</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* Student header card */}
        <div className="card" style={{ padding: '18px 16px', marginBottom: 20 }}>
          {/* Top row: avatar + name + status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-tag-bg)', border: '1px solid var(--accent-tag-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontSize: 14, fontWeight: 700,
            }}>
              {getInitials(displayName)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</h1>
                <span className={`tag ${student.active ? 'tag-active' : 'tag-inactive'}`} style={{ fontSize: 11 }}>
                  {student.active ? 'Active' : 'Inactive'}
                </span>
                <span className="tag tag-skill" style={{ fontSize: 11 }}>{student.skill_level}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
                {student.email && <span>✉ {student.email}</span>}
                <span>{student.lesson_frequency}</span>
                <span>Since {format(new Date(student.start_date + 'T12:00:00'), 'MMM d, yyyy')}</span>
                {tenure > 0 && <span>{tenure}mo</span>}
                <span>{student.lesson_count} lesson{student.lesson_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {student.admin_notes && (
            <div style={{
              padding: '9px 12px', background: 'var(--bg-elevated)',
              borderRadius: 6, border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 14,
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes · </span>
              {student.admin_notes}
            </div>
          )}

          {/* Action buttons - wrap on mobile */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={toggleActive}>
              {student.active ? 'Deactivate' : 'Reactivate'}
            </button>
            <a href={`/s/${student.token}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
              Student page ↗
            </a>
            <button className="btn btn-ghost btn-sm" onClick={exportPDF} disabled={exporting}>
              {exporting ? 'Exporting…' : '↓ Export PDF'}
            </button>
            {student.email && (
              <button className="btn btn-ghost btn-sm" onClick={sendOnboardingEmail} title={`Send onboarding email to ${student.email}`}>
                ✉ Send Welcome
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={deleteStudent}>Delete</button>
          </div>
        </div>

        {/* Belt Panel */}
        {!loading && data && (
          <BeltPanel
            student={data.student}
            repertoire={data.repertoire}
            onStudentUpdated={load}
          />
        )}

        {/* Lessons + Repertoire */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}
          className="responsive-grid">

          {/* Lessons */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Lessons</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddLesson(true)}>+ Log Lesson</button>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
            ) : !data?.lessons?.length ? (
              <div className="card" style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
                No lessons logged yet.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(showAllLessons ? data.lessons : data.lessons.slice(0, LESSONS_INITIAL)).map((lesson: any, i: number) => (
                    <div key={lesson.id} className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                            {format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMM d, yyyy')}
                          </span>
                          {i === 0 && <span className="tag tag-active" style={{ fontSize: 10 }}>Latest</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          {student.email && (
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}
                              onClick={async () => {
                                const res = await fetch('/api/email', {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ lesson_id: lesson.id }),
                                })
                                if (res.ok) toast('Email sent to ' + student.email?.split('@')[0])
                                else toast('Email failed', 'error')
                              }}>✉</button>
                          )}
                          <button className="btn btn-danger btn-sm" style={{ padding: '4px 10px' }}
                            onClick={() => deleteLesson(lesson.id)}>✕</button>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>What we covered</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {lesson.what_we_covered}
                        </p>
                      </div>
                      <div style={{ marginBottom: lesson.lesson_songs?.length ? 10 : 0 }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>Focus for the week</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {lesson.focus_for_week}
                        </p>
                      </div>
                      {lesson.lesson_songs?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>Songs</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {lesson.lesson_songs.map((ls: any) => (
                              <span key={ls.song.id} className="tag tag-skill" style={{ fontSize: 11 }}>
                                {ls.song.title}{ls.song.artist ? ` — ${ls.song.artist}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {data.lessons.length > LESSONS_INITIAL && (
                  <button
                    onClick={() => setShowAllLessons(p => !p)}
                    style={{
                      marginTop: 10, width: '100%', padding: '10px',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    {showAllLessons
                      ? 'Show less ↑'
                      : `Show ${data.lessons.length - LESSONS_INITIAL} older lesson${data.lessons.length - LESSONS_INITIAL !== 1 ? 's' : ''} ↓`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Repertoire + Resources sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Repertoire</h2>
              {data?.repertoire?.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.repertoire.length} songs</span>
              )}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {!data?.repertoire?.length ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No songs yet.</div>
              ) : (
                <>
                  <div style={{
                    maxHeight: data.repertoire.length > 8 ? '392px' : 'none',
                    overflowY: data.repertoire.length > 8 ? 'auto' : 'visible',
                    overscrollBehavior: 'contain',
                  }}>
                    {data.repertoire.map((item: any, i: number) => (
                      <div key={item.song.id} style={{
                        padding: '10px 14px',
                        borderBottom: i < data.repertoire.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: 13, wordBreak: 'break-word' }}>{item.song.title}</div>
                        {item.song.artist && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{item.song.artist}</div>}
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                          {format(new Date(item.first_worked_on + 'T12:00:00'), 'MMM yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.repertoire.length > 8 && (
                    <div style={{
                      padding: '7px 14px', borderTop: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
                      background: 'var(--bg-elevated)',
                    }}>
                      Scroll to see all {data.repertoire.length} songs
                    </div>
                  )}
                </>
              )}
            </div>

            </div>
            {/* Resource assignment */}
            <ResourceAssignPanel studentId={student.id} />
          </div>
        </div>
      </main>

      {showEditModal && (
        <StudentModal student={student} onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); load(); toast('Student updated') }} />
      )}
      {showAddLesson && (
        <AddLessonModal
          studentId={student.id}
          studentEmail={student.email}
          allSongs={allSongs}
          onClose={() => setShowAddLesson(false)}
          onSaved={() => { setShowAddLesson(false); load() }}
        />
      )}
    </div>
  )
}

function AddLessonModal({ studentId, studentEmail, allSongs, onClose, onSaved }: {
  studentId: string
  studentEmail: string | null
  allSongs: Song[]
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
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

    // Save lesson
    const res = await fetch('/api/lessons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, student_id: studentId, song_ids: selected }),
    })

    if (!res.ok) {
      const d = await res.json(); setError(d.error || 'Error'); setSaving(false); return
    }

    const lesson = await res.json()

    // Auto-send email if student has one
    if (studentEmail) {
      const emailRes = await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id }),
      })
      if (emailRes.ok) toast('Lesson saved & notes emailed to student')
      else toast('Lesson saved (email failed)', 'error')
    } else {
      toast('Lesson saved')
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Sheet-style modal — slides up from bottom on mobile, centered on desktop */}
      <div className="card admin-sans" style={{
        width: '100%', maxWidth: 580,
        padding: '20px 20px 32px',
        maxHeight: '92vh', overflowY: 'auto',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        borderTopLeftRadius: 12, borderTopRightRadius: 12,
        margin: '0 auto',
      }}>
        {/* Pull handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Log Lesson</h2>
          {studentEmail && (
            <span style={{ fontSize: 12, color: 'var(--green)', background: 'rgba(61,122,82,0.1)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(61,122,82,0.25)' }}>
              ✉ Will auto-send
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Date</label>
            <input type="date" value={form.lesson_date}
              onChange={e => setForm(f => ({ ...f, lesson_date: e.target.value }))} />
          </div>
          <div>
            <label>What we covered *</label>
            <textarea value={form.what_we_covered}
              onChange={e => setForm(f => ({ ...f, what_we_covered: e.target.value }))}
              placeholder="Describe what you worked on in this lesson…" style={{ minHeight: 90 }} />
          </div>
          <div>
            <label>Focus for the week *</label>
            <textarea value={form.focus_for_week}
              onChange={e => setForm(f => ({ ...f, focus_for_week: e.target.value }))}
              placeholder="What should they practice this week?" style={{ minHeight: 70 }} />
          </div>

          <div>
            <label>Songs worked on</label>
            <input placeholder="Search songs…" value={songSearch}
              onChange={e => setSongSearch(e.target.value)} style={{ marginBottom: 6 }} />
            <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
              {filtered.map(song => (
                <div key={song.id} onClick={() => toggle(song.id)} style={{
                  padding: '9px 12px', cursor: 'pointer',
                  background: selected.includes(song.id) ? 'var(--accent-glow)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: selected.includes(song.id) ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13 }}>
                    {song.title}{song.artist ? ` — ${song.artist}` : ''}
                  </span>
                  {selected.includes(song.id) && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>No songs match.</div>
              )}
            </div>
            <div style={{ padding: 11, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Add new song to library</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ flex: '2 1 100px' }} />
                <input placeholder="Artist (optional)" value={newArtist} onChange={e => setNewArtist(e.target.value)} style={{ flex: '2 1 100px' }} />
                <button className="btn btn-ghost btn-sm" onClick={addSong} style={{ flexShrink: 0 }}>Add</button>
              </div>
            </div>
            {selected.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selected.map(id => {
                  const song = localSongs.find(s => s.id === id)
                  return song ? (
                    <span key={id} className="tag tag-skill" style={{ fontSize: 11 }}>
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
            {saving ? 'Saving…' : studentEmail ? 'Save & Send Notes' : 'Log lesson'}
          </button>
        </div>
      </div>
    </div>
  )
}
