'use client'

import { format } from 'date-fns'
import { BELT_COLORS, BELT_ORDER, type Belt } from '@/lib/supabase'

// Belt-specific accent colors for certificate design
const CERT_PALETTES: Record<Belt, {
  bg: string, border: string, accent: string,
  accentLight: string, text: string, stripe: string
}> = {
  White: {
    bg: '#fdfcfa', border: '#c8a96e', accent: '#8b6914',
    accentLight: '#f5f0e6', text: '#1a1814', stripe: '#c8a96e',
  },
  Blue: {
    bg: '#f5f8ff', border: '#3b7dd8', accent: '#2563b0',
    accentLight: '#dbeafe', text: '#1e3a5f', stripe: '#3b7dd8',
  },
  Purple: {
    bg: '#faf5ff', border: '#7c4db8', accent: '#6d28d9',
    accentLight: '#ede9fe', text: '#3b1f6e', stripe: '#7c4db8',
  },
  Brown: {
    bg: '#fdf8f5', border: '#8b5e3c', accent: '#7c4a28',
    accentLight: '#fde8d8', text: '#3c1f0e', stripe: '#8b5e3c',
  },
  Black: {
    bg: '#f5f5f5', border: '#1a1814', accent: '#1a1814',
    accentLight: '#e5e5e5', text: '#1a1814', stripe: '#c8a96e',
  },
}

type CertType = 'belt' | 'stripe'

export async function generateCertificate({
  studentName,
  belt,
  stripes,
  certType,
  teacherName,
  studioName,
  date,
}: {
  studentName: string
  belt: Belt
  stripes: number
  certType: CertType
  teacherName: string
  studioName: string
  date: Date
}) {
  const { jsPDF } = await import('jspdf')

  // Landscape letter for certificate feel
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' })

  const W = 792
  const H = 612
  const PAL = CERT_PALETTES[belt]
  const beltColor = BELT_COLORS[belt]
  const isBlack = belt === 'Black'

  // ── Background ─────────────────────────────────────────
  // Warm off-white bg
  doc.setFillColor(PAL.bg)
  doc.rect(0, 0, W, H, 'F')

  // ── Outer decorative border ─────────────────────────────
  // Thick outer frame
  doc.setDrawColor(PAL.border)
  doc.setLineWidth(8)
  doc.rect(20, 20, W - 40, H - 40)

  // Thin inner frame
  doc.setLineWidth(1.5)
  doc.rect(32, 32, W - 64, H - 64)

  // Corner ornaments — small squares at each corner
  doc.setFillColor(PAL.border)
  const CORNER = 8
  for (const [cx, cy] of [[32, 32], [W - 32 - CORNER, 32], [32, H - 32 - CORNER], [W - 32 - CORNER, H - 32 - CORNER]]) {
    doc.rect(cx, cy, CORNER, CORNER, 'F')
  }

  // ── Belt color bar at top ───────────────────────────────
  doc.setFillColor(beltColor)
  doc.rect(32, 32, W - 64, 52, 'F')

  // Stripe marks in the belt bar — right side
  const stripeCount = certType === 'stripe' ? stripes : (certType === 'belt' ? 0 : stripes)
  if (certType === 'belt' || certType === 'stripe') {
    const displayStripes = certType === 'stripe' ? stripes : 0
    // Belt tip (black section)
    doc.setFillColor('#1a1814')
    doc.rect(W - 32 - 140, 32, 140, 52, 'F')
    // White stripes in tip
    for (let i = 0; i < 4; i++) {
      const sx = W - 32 - 130 + i * 28
      if (i < displayStripes) {
        doc.setFillColor('#ffffff')
      } else {
        doc.setFillColor('rgba(255,255,255,0)')
        doc.setDrawColor('rgba(255,255,255,0.25)')
        doc.setLineWidth(0.5)
      }
      if (i < displayStripes) {
        doc.rect(sx, 40, 18, 36, 'F')
      } else {
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.5)
        doc.rect(sx, 40, 18, 36)
      }
    }
  }

  // ── Studio name in belt bar ─────────────────────────────
  const isWhiteBelt = belt === 'White'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(isWhiteBelt ? PAL.accent : 'rgba(255,255,255,0.8)')
  doc.text(studioName.toUpperCase(), 52, 63)

  // ── Main content area ───────────────────────────────────
  const contentY = 32 + 52 + 40 // below belt bar + padding

  // "Certificate of Achievement" header
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(PAL.accent)
  const headerText = 'CERTIFICATE OF ACHIEVEMENT'
  const headerW = doc.getTextWidth(headerText)
  // Letter-spaced manually via characters
  doc.text(headerText, (W - headerW) / 2, contentY)

  // Decorative line under header
  doc.setDrawColor(PAL.border)
  doc.setLineWidth(0.5)
  const lineY = contentY + 10
  doc.line(W / 2 - 120, lineY, W / 2 + 120, lineY)

  // "This certifies that" intro
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(PAL.text)
  doc.setTextColor(100, 90, 80)
  const intro = 'This certifies that'
  doc.text(intro, (W - doc.getTextWidth(intro)) / 2, lineY + 36)

  // Student name — large and prominent
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(42)
  doc.setTextColor(PAL.text)
  const nameW = doc.getTextWidth(studentName)
  // If name is too wide, scale down
  const nameFontSize = nameW > W - 160 ? Math.floor(42 * ((W - 160) / nameW)) : 42
  doc.setFontSize(nameFontSize)
  const nameW2 = doc.getTextWidth(studentName)
  doc.text(studentName, (W - nameW2) / 2, lineY + 84)

  // Underline the name
  doc.setDrawColor(PAL.border)
  doc.setLineWidth(1)
  doc.line((W - nameW2) / 2, lineY + 90, (W + nameW2) / 2, lineY + 90)

  // Achievement text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(100, 90, 80)

  let achievementLine1 = ''
  let achievementLine2 = ''

  if (certType === 'belt') {
    achievementLine1 = `has been promoted to`
    achievementLine2 = `${belt} Belt`
  } else {
    achievementLine1 = `has earned Stripe ${stripes}`
    achievementLine2 = `on the ${belt} Belt`
  }

  doc.text(achievementLine1, (W - doc.getTextWidth(achievementLine1)) / 2, lineY + 122)

  // Belt/stripe name — large colored text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(PAL.accent)
  const achieveW = doc.getTextWidth(achievementLine2)
  doc.text(achievementLine2, (W - achieveW) / 2, lineY + 160)

  // ── Belt visual strip ───────────────────────────────────
  const beltVisY = lineY + 178
  const beltVisW = 220
  const beltVisH = 28
  const beltVisX = (W - beltVisW) / 2

  doc.setFillColor(beltColor)
  doc.roundedRect(beltVisX, beltVisY, beltVisW, beltVisH, 4, 4, 'F')
  if (isWhiteBelt) {
    doc.setDrawColor(PAL.border)
    doc.setLineWidth(0.5)
    doc.roundedRect(beltVisX, beltVisY, beltVisW, beltVisH, 4, 4)
  }

  // Belt tip
  doc.setFillColor('#1a1814')
  doc.roundedRect(beltVisX + beltVisW - 80, beltVisY, 80, beltVisH, 4, 4, 'F')

  // Stripes in tip
  const displayStripes2 = certType === 'stripe' ? stripes : 0
  for (let i = 0; i < 4; i++) {
    const sx = beltVisX + beltVisW - 74 + i * 16
    if (i < displayStripes2) {
      doc.setFillColor('#ffffff')
      doc.rect(sx, beltVisY + 4, 10, beltVisH - 8, 'F')
    } else {
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.3)
      doc.rect(sx, beltVisY + 4, 10, beltVisH - 8)
    }
  }

  // ── Bottom section: date + signature ───────────────────
  const bottomY = H - 32 - 80

  // Left: Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(PAL.text)
  const dateStr = format(date, 'MMMM d, yyyy')
  doc.text(dateStr, 80, bottomY)
  doc.setDrawColor(PAL.border)
  doc.setLineWidth(0.5)
  doc.line(60, bottomY + 6, 60 + 160, bottomY + 6)
  doc.setFontSize(9)
  doc.setTextColor(150, 140, 130)
  doc.text('Date', 60 + 60, bottomY + 18)

  // Right: Teacher signature line
  const sigX = W - 60 - 180
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PAL.text)
  doc.text(teacherName, sigX + 90 - doc.getTextWidth(teacherName) / 2, bottomY)
  doc.setDrawColor(PAL.border)
  doc.setLineWidth(0.5)
  doc.line(sigX, bottomY + 6, sigX + 180, bottomY + 6)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 140, 130)
  doc.text('Instructor', sigX + 66, bottomY + 18)

  // Center: Small guitar icon text
  doc.setFontSize(18)
  doc.text('🎸', W / 2 - 10, bottomY + 2)

  // ── Footer ──────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(180, 170, 160)
  const footer = `${studioName} · Guitar Achievement Program`
  doc.text(footer, (W - doc.getTextWidth(footer)) / 2, H - 42)

  // Save
  const certLabel = certType === 'belt'
    ? `${belt}-Belt`
    : `${belt}-Belt-Stripe-${stripes}`
  const filename = `${studentName.replace(/\s+/g, '-')}-${certLabel}-Certificate.pdf`
  doc.save(filename)
}
