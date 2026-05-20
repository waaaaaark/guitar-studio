'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import type { Student } from '@/lib/supabase'
import StudentModal from './StudentModal'
import StudentDetail from './StudentDetail'
import SongsLibrary from './SongsLibrary'
import ImportModal from './ImportModal'
import { ThemeToggle } from '@/lib/theme'
import BulkEmailModal from './BulkEmailModal'
import { useToast } from '@/lib/toast'
import TipsManager from './TipsManager'
import ResourcesLibrary from './ResourcesLibrary'
import CurriculumEditor from './CurriculumEditor'
import HowItWorksAdmin from './HowItWorksAdmin'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function AdminPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'roster' | 'student' | 'songs' | 'tips' | 'resources' | 'curriculum'>('roster')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [search, setSearch] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [hasTestData, setHasTestData] = useState(false)
  const [pendingMastery, setPendingMastery] = useState<any[]>([])

  const loadStudents = useCallback(async () => {
    const [studentsRes, masteryRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/mastery'),
    ])
    const data = await studentsRes.json()
    const mastery = await masteryRes.json()
    setStudents(data)
    setPendingMastery(mastery)
    setHasTestData(data.some((s: Student) => s.name.includes('__test__')))
    setLoading(false)
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.reload()
  }

  async function generateTestData() {
    setTestLoading(true)
    const res = await fetch('/api/test-data', { method: 'POST' })
    const d = await res.json()
    setTestLoading(false)
    if (res.ok) {
      toast(`Created ${d.students} test students, ${d.lessons} lessons`, 'success')
      loadStudents()
    } else {
      toast(d.error || 'Failed to generate test data', 'error')
    }
  }

  async function removeTestData() {
    if (!confirm('Remove all test data?')) return
    setTestLoading(true)
    const res = await fetch('/api/test-data', { method: 'DELETE' })
    const d = await res.json()
    setTestLoading(false)
    if (res.ok) {
      toast(`Removed test data`, 'success')
      loadStudents()
    } else {
      toast(d.error || 'Failed to remove test data', 'error')
    }
  }

  const currentView = view as string
  const activeStudents = students.filter(s => s.active && !s.name.includes('__test__'))
  const inactiveStudents = students.filter(s => !s.active && !s.name.includes('__test__'))
  const testStudents = students.filter(s => s.name.includes('__test__'))

  const filterStudents = (list: Student[]) =>
    search.trim() ? list.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : list

  if (currentView === 'student' && selectedStudent) {
    return (
      <StudentDetail
        student={selectedStudent}
        onBack={() => { setView('roster'); setSelectedStudent(null) }}
        onStudentUpdated={(updated) => { setSelectedStudent(updated); loadStudents() }}
      />
    )
  }

  if (currentView === 'songs') return <SongsLibrary onBack={() => setView('roster')} />
  if (currentView === 'tips') return <TipsManager onBack={() => setView('roster')} />
  if (currentView === 'resources') return <ResourcesLibrary onBack={() => setView('roster')} />
  if (currentView === 'curriculum') return <CurriculumEditor onBack={() => setView('roster')} />

  const tabs = [
    { key: 'active', label: 'Active', count: activeStudents.length },
    { key: 'inactive', label: 'Inactive', count: inactiveStudents.length },
    ...(testStudents.length > 0 ? [{ key: 'test', label: 'Test Data', count: testStudents.length }] : []),
  ] as const

  const displayList = filterStudents(
    activeTab === 'active' ? activeStudents
    : activeTab === 'inactive' ? inactiveStudents
    : testStudents
  )

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="hide-mobile" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14, marginRight: 8, whiteSpace: 'nowrap' }}>🎸</span>
          <div style={{ display: 'flex' }}>
            {(['Students', 'Songs', 'Tips', 'Resources', 'Curriculum'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab === 'Students' ? 'roster' : tab === 'Songs' ? 'songs' : tab === 'Tips' ? 'tips' : 'resources')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px', fontSize: 13, fontFamily: 'inherit',
                color: (tab === 'Students' ? currentView === 'roster' : tab === 'Songs' ? currentView === 'songs' : tab === 'Tips' ? currentView === 'tips' : tab === 'Resources' ? currentView === 'resources' : currentView === 'curriculum') ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: (tab === 'Students' ? currentView === 'roster' : tab === 'Songs' ? currentView === 'songs' : tab === 'Tips' ? currentView === 'tips' : tab === 'Resources' ? currentView === 'resources' : currentView === 'curriculum') ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, paddingBottom: 6, whiteSpace: 'nowrap',
              }}>{tab}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HowItWorksAdmin />
          <ThemeToggle />
          <button onClick={logout} className="btn btn-ghost btn-sm hide-mobile">Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Students</h1>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                {activeStudents.length} active · {inactiveStudents.length} inactive
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkEmail(true)}>✉ Bulk Email</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>↑ Import Sheet</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add Student</button>
            </div>
          </div>
          <input placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {/* Mastery approval notification panel */}
        {pendingMastery.length > 0 && (
          <div style={{
            marginBottom: 20, padding: '14px 16px',
            background: 'rgba(200,169,110,0.08)',
            border: '1px solid rgba(200,169,110,0.3)',
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                {pendingMastery.length} song{pendingMastery.length !== 1 ? 's' : ''} awaiting mastery approval
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pendingMastery.map((item: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-card)',
                  borderRadius: 7, border: '1px solid var(--border)', gap: 10,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{item.student?.name?.replace(/__test__/g, '').trim()}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>
                    <span>{item.song?.title}{item.song?.artist ? ` — ${item.song.artist}` : ''}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={async (e) => {
                      e.stopPropagation()
                      const res = await fetch('/api/mastery', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student_id: item.student_id, song_id: item.song_id }),
                      })
                      if (res.ok) { toast('✓ Mastery approved — +100 XP!'); loadStudents() }
                      else toast('Approval failed', 'error')
                    }}
                  >
                    ✓ Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 14, fontFamily: 'inherit',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Student list */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>Loading…</div>
        ) : displayList.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>
            {search ? 'No students match.' : `No ${activeTab} students.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayList.map(student => (
              <button key={student.id}
                onClick={() => { setSelectedStudent(student); setView('student') }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px', cursor: 'pointer',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, width: '100%', textAlign: 'left',
                  transition: 'border-color 0.15s, box-shadow 0.15s', gap: 12,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-dim)'; e.currentTarget.style.boxShadow = '0 2px 8px var(--accent-glow)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-tag-bg)', border: '1px solid var(--accent-tag-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                  }}>
                    {getInitials(student.name.replace('__test__', '').trim())}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.name.replace('__test__', '').trim()}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      {student.lesson_count} lessons · {student.lesson_frequency}
                      <span className="hide-mobile"> · Since {format(new Date(student.start_date + 'T12:00:00'), 'MMM yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {(student as any).pending_mastery > 0 && (
                    <span style={{
                      fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600,
                      background: 'rgba(200,169,110,0.15)', color: 'var(--accent)',
                      border: '1px solid rgba(200,169,110,0.3)',
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      ⭐ {(student as any).pending_mastery}
                    </span>
                  )}
                  {student.belt_system_active && student.current_streak > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'sans-serif' }} className="hide-mobile">
                      🔥 {student.current_streak}d
                    </span>
                  )}
                  <span className="tag tag-skill hide-mobile">{student.skill_level}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Developer Tools — hidden for now */}
        {false && (
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!hasTestData ? (
                <button className="btn btn-ghost btn-sm" onClick={generateTestData} disabled={testLoading}>
                  {testLoading ? 'Generating…' : '⚗ Generate Test Data'}
                </button>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={removeTestData} disabled={testLoading}>
                  {testLoading ? 'Removing…' : '✕ Remove Test Data'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {showAddModal && <StudentModal onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); loadStudents() }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); loadStudents() }} />}
      {showBulkEmail && <BulkEmailModal students={students} onClose={() => setShowBulkEmail(false)} />}
    </div>
  )
}
