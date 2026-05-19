'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, differenceInMonths } from 'date-fns'
import type { Student } from '@/lib/supabase'
import StudentModal from './StudentModal'
import StudentDetail from './StudentDetail'
import SongsLibrary from './SongsLibrary'

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'roster' | 'student' | 'songs'>('roster')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')

  const loadStudents = useCallback(async () => {
    const res = await fetch('/api/students')
    const data = await res.json()
    setStudents(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.reload()
  }

  const currentView = view as string
  const activeStudents = students.filter(s => s.active)
  const inactiveStudents = students.filter(s => !s.active)

  if (currentView === 'student' && selectedStudent) {
    return (
      <StudentDetail
        student={selectedStudent}
        onBack={() => { setView('roster'); setSelectedStudent(null) }}
        onStudentUpdated={(updated) => {
          setSelectedStudent(updated)
          loadStudents()
        }}
      />
    )
  }

  if (currentView === 'songs') {
    return <SongsLibrary onBack={() => setView('roster')} />
  }

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 15 }}>Guitar Studio</span>
          <button
            onClick={() => setView('roster')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              color: currentView === 'roster' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 14, borderBottom: currentView === 'roster' ? '2px solid var(--accent)' : '2px solid transparent',
              paddingBottom: 2,
            }}
          >Students</button>
          <button
            onClick={() => setView('songs')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              color: currentView === 'songs' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 14, borderBottom: currentView === 'songs' ? '2px solid var(--accent)' : '2px solid transparent',
              paddingBottom: 2,
            }}
          >Song Library</button>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm">Sign out</button>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Students</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              {activeStudents.length} active · {inactiveStudents.length} inactive
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Student
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {(['active', 'inactive'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 20px',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 14, fontFamily: 'inherit',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              textTransform: 'capitalize',
            }}>{tab} ({tab === 'active' ? activeStudents.length : inactiveStudents.length})</button>
          ))}
        </div>

        {/* Student list */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(activeTab === 'active' ? activeStudents : inactiveStudents).map(student => (
              <button
                key={student.id}
                onClick={() => { setSelectedStudent(student); setView('student') }}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', cursor: 'pointer', border: '1px solid var(--border)',
                  background: 'var(--bg-card)', width: '100%', textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--accent-glow)', border: '1px solid rgba(200,169,110,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', fontSize: 14, fontWeight: 600, flexShrink: 0,
                  }}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 15 }}>
                      {student.name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                      {student.lesson_count} lessons · {student.lesson_frequency} · Since {format(new Date(student.start_date + 'T12:00:00'), 'MMM yyyy')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`tag tag-skill`}>{student.skill_level}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                </div>
              </button>
            ))}
            {(activeTab === 'active' ? activeStudents : inactiveStudents).length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 0' }}>
                No {activeTab} students.
              </div>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <StudentModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); loadStudents() }}
        />
      )}
    </div>
  )
}
