'use client'

import { useState } from 'react'
import { format } from 'date-fns'

type Props = {
  lessons: any[]
}

const INITIAL_SHOW = 3

export default function PastLessons({ lessons }: Props) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? lessons : lessons.slice(0, INITIAL_SHOW)
  const hidden = lessons.length - INITIAL_SHOW

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((lesson: any) => (
          <details key={lesson.id} className="card" style={{ overflow: 'hidden' }}>
            <summary style={{
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              listStyle: 'none', userSelect: 'none',
            }}>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'sans-serif', fontSize: 14 }}>
                {format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>↓</span>
            </summary>
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
              <div style={{ paddingTop: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'sans-serif' }}>
                  What we covered
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>
                  {lesson.what_we_covered}
                </p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'sans-serif' }}>
                  Focus
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>
                  {lesson.focus_for_week}
                </p>
              </div>
              {lesson.lesson_songs?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'sans-serif' }}>
                    Songs
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {lesson.lesson_songs.map((ls: any) => (
                      <span key={ls.song.id} className="tag tag-skill" style={{ fontSize: 12 }}>
                        {ls.song.title}{ls.song.artist ? ` — ${ls.song.artist}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      {!showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            marginTop: 12, width: '100%',
            padding: '12px', cursor: 'pointer',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)',
            fontFamily: 'sans-serif', fontSize: 14,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Show {hidden} older lesson{hidden !== 1 ? 's' : ''} ↓
        </button>
      )}

      {showAll && lessons.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(false)}
          style={{
            marginTop: 12, width: '100%',
            padding: '12px', cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)',
            fontFamily: 'sans-serif', fontSize: 14,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Show less ↑
        </button>
      )}
    </div>
  )
}
