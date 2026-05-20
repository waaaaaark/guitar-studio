'use client'

import { BELT_COLORS, BELT_TEXT_COLORS, BELT_ORDER, type Belt, type StudentProfile } from '@/lib/supabase'

type Props = {
  belt: Belt
  stripes: number
  profile: StudentProfile
  totalXP: number
  currentStripeXP: number
  stripeThreshold: number
  stripeEligible?: boolean
  beltEligible?: boolean
  compact?: boolean
}

const RANK_NAMES: Record<StudentProfile, Record<Belt, string>> = {
  Child: {
    White: 'String Squire',
    Blue: 'Chord Champion',
    Purple: 'Melody Maker',
    Brown: 'Riff Ranger',
    Black: 'Guitar Hero',
  },
  Teen: {
    White: 'Garage Band',
    Blue: 'Opening Act',
    Purple: 'Rising Star',
    Brown: 'Headliner',
    Black: 'Legend',
  },
  Adult: {
    White: 'Beginner',
    Blue: 'Developing',
    Purple: 'Intermediate',
    Brown: 'Advanced',
    Black: 'Master',
  },
}

export function BeltDisplay({ belt, stripes, profile, totalXP, currentStripeXP, stripeThreshold, stripeEligible, beltEligible, compact }: Props) {
  const beltColor = BELT_COLORS[belt]
  const textColor = BELT_TEXT_COLORS[belt]
  const rankName = RANK_NAMES[profile][belt]
  const isBlackBelt = belt === 'Black'
  const progress = stripeThreshold > 0 ? Math.min((currentStripeXP / stripeThreshold) * 100, 100) : 100

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BeltVisual belt={belt} stripes={stripes} size="sm" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
          {belt} Belt
        </span>
      </div>
    )
  }

  return (
    <div style={{
      background: profile === 'Child'
        ? 'linear-gradient(135deg, #fdf8ee 0%, #f5f0e6 100%)'
        : 'var(--bg-card)',
      border: `2px solid ${beltColor}`,
      borderRadius: 12,
      padding: 20,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background accent for Child profile */}
      {profile === 'Child' && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: `${beltColor}15`,
        }} />
      )}

      {/* Belt rank name */}
      <div style={{
        fontSize: profile === 'Child' ? 11 : 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        fontFamily: 'sans-serif',
        marginBottom: 10,
      }}>
        {rankName}
      </div>

      {/* Belt visual */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <BeltVisual belt={belt} stripes={stripes} size="lg" />
      </div>

      {/* Belt name */}
      <div style={{
        fontSize: profile === 'Child' ? 20 : 17,
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 4,
        fontFamily: 'sans-serif',
      }}>
        {belt} Belt
      </div>

      {/* Stripes indicator */}
      {!isBlackBelt && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'sans-serif' }}>
          {stripes}/4 stripes
        </div>
      )}

      {/* XP progress bar (only show if belt system active and not black belt) */}
      {!isBlackBelt && stripeThreshold > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{
            background: 'var(--border)',
            borderRadius: 20,
            height: 8,
            overflow: 'hidden',
            marginBottom: 6,
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: beltColor === '#f0ece4' ? '#c8a96e' : beltColor,
              borderRadius: 20,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
            {currentStripeXP.toLocaleString()} / {stripeThreshold.toLocaleString()} XP toward next stripe
          </div>
        </div>
      )}

      {/* Eligibility badges */}
      {stripeEligible && !beltEligible && (
        <div style={{
          marginTop: 10,
          padding: '6px 14px',
          background: 'rgba(61,122,82,0.1)',
          border: '1px solid rgba(61,122,82,0.3)',
          borderRadius: 20,
          fontSize: 12,
          color: 'var(--green)',
          fontFamily: 'sans-serif',
          display: 'inline-block',
        }}>
          ⭐ Stripe ready — waiting for approval
        </div>
      )}
      {beltEligible && (
        <div style={{
          marginTop: 10,
          padding: '6px 14px',
          background: `${beltColor}20`,
          border: `1px solid ${beltColor}`,
          borderRadius: 20,
          fontSize: 12,
          color: beltColor === '#f0ece4' ? '#8b6914' : beltColor,
          fontFamily: 'sans-serif',
          display: 'inline-block',
          fontWeight: 600,
        }}>
          🥋 Belt promotion ready!
        </div>
      )}

      {/* Total XP */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
        {totalXP.toLocaleString()} total XP
      </div>
    </div>
  )
}

export function BeltVisual({ belt, stripes, size = 'md' }: { belt: Belt; stripes: number; size?: 'sm' | 'md' | 'lg' }) {
  const beltColor = BELT_COLORS[belt]
  const isWhite = belt === 'White'

  const dims = {
    sm: { w: 60, h: 14, stripeW: 8, stripeH: 10, gap: 3 },
    md: { w: 100, h: 20, stripeW: 10, stripeH: 14, gap: 4 },
    lg: { w: 160, h: 28, stripeW: 14, stripeH: 20, gap: 5 },
  }[size]

  return (
    <div style={{
      width: dims.w,
      height: dims.h,
      background: beltColor,
      borderRadius: 4,
      border: isWhite ? '1px solid #e2ddd5' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: dims.gap + 2,
      gap: dims.gap,
      boxShadow: `0 2px 8px ${beltColor}40`,
      position: 'relative',
    }}>
      {/* Black tip on belt */}
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: dims.stripeW * 4 + dims.gap * 5 + 8,
        background: 'rgba(0,0,0,0.85)',
        borderRadius: '0 4px 4px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dims.gap,
        paddingLeft: dims.gap,
        paddingRight: dims.gap,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: dims.stripeW,
            height: dims.stripeH,
            background: i < stripes ? 'white' : 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 2,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}
