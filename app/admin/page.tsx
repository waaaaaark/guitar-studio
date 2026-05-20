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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function AdminPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'roster' | 'student' | 'songs'>('roster')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [search, setSearch] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [hasTestData, setHasTestData] = useState(false)

  const loadStudents = useCallback(async () => {
    const res = await fetch('/api/students')
    const data = await res.json()
    setStudents(data)
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
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15 }}>🎸 Studio</span>
          <div style={{ display: 'flex' }}>
            {(['Students', 'Songs'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab === 'Students' ? 'roster' : 'songs')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 12px', fontSize: 14, fontFamily: 'inherit',
                color: (tab === 'Students' ? currentView === 'roster' : currentView === 'songs') ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: (tab === 'Students' ? currentView === 'roster' : currentView === 'songs') ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, paddingBottom: 6,
              }}>{tab}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Test data controls */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Developer Tools
          </div>
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
      </main>

      {showAddModal && <StudentModal onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); loadStudents() }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); loadStudents() }} />}
      {showBulkEmail && <BulkEmailModal students={students} onClose={() => setShowBulkEmail(false)} />}
    </div>
  )
}
