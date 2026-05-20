'use client'

import { format } from 'date-fns'

type Props = {
  repertoire: any[]
}

const VISIBLE = 8

export default function RepertoireList({ repertoire }: Props) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Scrollable inner container — shows 8 rows, scrolls beyond */}
      <div style={{
        maxHeight: repertoire.length > VISIBLE ? `${VISIBLE * 49}px` : 'none',
        overflowY: repertoire.length > VISIBLE ? 'auto' : 'visible',
        overscrollBehavior: 'contain',
      }}>
        {repertoire.map((item: any, i: number) => (
          <div key={item.song.id} style={{
            padding: '13px 18px',
            borderBottom: i < repertoire.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ color: 'var(--text-primary)' }}>{item.song.title}</span>
              {item.song.artist && (
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
                  {item.song.artist}
                </span>
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'sans-serif', flexShrink: 0 }}>
              {format(new Date(item.first_worked_on + 'T12:00:00'), 'MMM yyyy')}
            </span>
          </div>
        ))}
      </div>
      {repertoire.length > VISIBLE && (
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-muted)',
          fontFamily: 'sans-serif', textAlign: 'center',
          background: 'var(--bg-elevated)',
        }}>
          Scroll to see all {repertoire.length} songs
        </div>
      )}
    </div>
  )
}
