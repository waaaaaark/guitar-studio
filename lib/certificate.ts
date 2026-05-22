// No 'use client' directive — this is imported dynamically only
// All code runs in browser context via dynamic import in BeltPanel

type Belt = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black'
type CertType = 'belt' | 'stripe'

const BELT_RGB: Record<Belt, [number, number, number]> = {
  White:  [240, 236, 228],
  Blue:   [59,  125, 216],
  Purple: [124, 77,  184],
  Brown:  [139, 94,  60],
  Black:  [26,  24,  20],
}

const PALETTES: Record<Belt, {
  bg: [number,number,number]
  border: [number,number,number]
  accent: [number,number,number]
  text: [number,number,number]
  muted: [number,number,number]
  barText: [number,number,number]
}> = {
  White:  { bg:[253,252,250], border:[200,169,110], accent:[139,105,20],  text:[26,24,20],  muted:[150,140,130], barText:[139,105,20]  },
  Blue:   { bg:[245,248,255], border:[59,125,216],  accent:[37,99,176],   text:[30,58,95],  muted:[150,140,130], barText:[255,255,255] },
  Purple: { bg:[250,245,255], border:[124,77,184],  accent:[109,40,217],  text:[59,31,110], muted:[150,140,130], barText:[255,255,255] },
  Brown:  { bg:[253,248,245], border:[139,94,60],   accent:[124,74,40],   text:[60,31,14],  muted:[150,140,130], barText:[255,255,255] },
  Black:  { bg:[245,245,245], border:[26,24,20],    accent:[26,24,20],    text:[26,24,20],  muted:[150,140,130], barText:[200,169,110] },
}

function formatDate(date: Date): string {
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

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
  // Dynamic import keeps jsPDF out of SSR bundle
  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || (jspdfModule as any).default

  if (!jsPDF) throw new Error('jsPDF not found in module')

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' })

  const W = 792
  const H = 612
  const P = PALETTES[belt]
  const beltRGB = BELT_RGB[belt]
  const isWhite = belt === 'White'

  const fill  = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: [number,number,number]) => doc.setDrawColor(c[0], c[1], c[2])
  const tc    = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2])

  // ── Background ──────────────────────────────────────────
  fill(P.bg)
  doc.rect(0, 0, W, H, 'F')

  // ── Outer border ────────────────────────────────────────
  stroke(P.border)
  doc.setLineWidth(8)
  doc.rect(20, 20, W - 40, H - 40)
  doc.setLineWidth(1.5)
  doc.rect(32, 32, W - 64, H - 64)

  // Corner ornaments
  fill(P.border)
  const C = 8
  const corners: [number,number][] = [[32,32],[W-32-C,32],[32,H-32-C],[W-32-C,H-32-C]]
  for (const [cx, cy] of corners) doc.rect(cx, cy, C, C, 'F')

  // ── Belt bar at top ──────────────────────────────────────
  fill(beltRGB)
  doc.rect(32, 32, W - 64, 52, 'F')
  if (isWhite) {
    stroke(P.border)
    doc.setLineWidth(0.5)
    doc.rect(32, 32, W - 64, 52)
  }

  // Black tip on belt bar
  doc.setFillColor(26, 24, 20)
  doc.rect(W - 32 - 140, 32, 140, 52, 'F')

  // Stripes in tip
  const displayStripes = certType === 'stripe' ? stripes : 0
  for (let i = 0; i < 4; i++) {
    const sx = W - 32 - 130 + i * 28
    if (i < displayStripes) {
      doc.setFillColor(255, 255, 255)
      doc.rect(sx, 40, 18, 36, 'F')
    } else {
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.4)
      doc.rect(sx, 40, 18, 36)
    }
  }

  // Studio name in belt bar
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  tc(P.barText)
  doc.text(studioName.toUpperCase(), 52, 63)

  // ── Main content ─────────────────────────────────────────
  const contentY = 32 + 52 + 44
  const lineY = contentY + 12

  // "Certificate of Achievement"
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  tc(P.accent)
  const headerText = 'CERTIFICATE OF ACHIEVEMENT'
  doc.text(headerText, (W - doc.getTextWidth(headerText)) / 2, contentY)

  // Decorative line
  stroke(P.border)
  doc.setLineWidth(0.5)
  doc.line(W / 2 - 120, lineY, W / 2 + 120, lineY)

  // "This certifies that"
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(100, 90, 80)
  const intro = 'This certifies that'
  doc.text(intro, (W - doc.getTextWidth(intro)) / 2, lineY + 36)

  // Student name — scale down if very long
  doc.setFont('helvetica', 'bold')
  tc(P.text)
  let fontSize = 42
  doc.setFontSize(fontSize)
  while (doc.getTextWidth(studentName) > W - 160 && fontSize > 20) {
    fontSize -= 2
    doc.setFontSize(fontSize)
  }
  const nameW = doc.getTextWidth(studentName)
  const nameX = (W - nameW) / 2
  doc.text(studentName, nameX, lineY + 82)

  // Name underline
  stroke(P.border)
  doc.setLineWidth(1)
  doc.line(nameX, lineY + 88, nameX + nameW, lineY + 88)

  // Achievement lines
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(100, 90, 80)
  const line1 = certType === 'belt' ? 'has been promoted to' : `has earned Stripe ${stripes}`
  doc.text(line1, (W - doc.getTextWidth(line1)) / 2, lineY + 120)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  tc(P.accent)
  const line2 = certType === 'belt' ? `${belt} Belt` : `on the ${belt} Belt`
  doc.text(line2, (W - doc.getTextWidth(line2)) / 2, lineY + 154)

  // ── Belt visual ──────────────────────────────────────────
  const bvY = lineY + 172
  const bvW = 200
  const bvH = 26
  const bvX = (W - bvW) / 2

  fill(beltRGB)
  doc.rect(bvX, bvY, bvW, bvH, 'F')
  if (isWhite) {
    stroke(P.border)
    doc.setLineWidth(0.5)
    doc.rect(bvX, bvY, bvW, bvH)
  }

  doc.setFillColor(26, 24, 20)
  doc.rect(bvX + bvW - 72, bvY, 72, bvH, 'F')

  for (let i = 0; i < 4; i++) {
    const sx = bvX + bvW - 66 + i * 15
    if (i < displayStripes) {
      doc.setFillColor(255, 255, 255)
      doc.rect(sx, bvY + 4, 9, bvH - 8, 'F')
    } else {
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.3)
      doc.rect(sx, bvY + 4, 9, bvH - 8)
    }
  }

  // ── Signature section ────────────────────────────────────
  const botY = H - 32 - 76

  // Date left
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  tc(P.text)
  doc.text(formatDate(date), 80, botY)
  stroke(P.border)
  doc.setLineWidth(0.5)
  doc.line(60, botY + 6, 220, botY + 6)
  doc.setFontSize(9)
  doc.setTextColor(150, 140, 130)
  doc.text('Date', 118, botY + 18)

  // Center ornament
  doc.setFontSize(16)
  tc(P.border)
  doc.text('*', W / 2 - 5, botY + 2)

  // Instructor right
  const sigX = W - 60 - 180
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  tc(P.text)
  const tw = doc.getTextWidth(teacherName)
  doc.text(teacherName, sigX + 90 - tw / 2, botY)
  stroke(P.border)
  doc.setLineWidth(0.5)
  doc.line(sigX, botY + 6, sigX + 180, botY + 6)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 140, 130)
  doc.text('Instructor', sigX + 62, botY + 18)

  // ── Footer ───────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(180, 170, 160)
  const footer = `${studioName}  |  Guitar Achievement Program`
  doc.text(footer, (W - doc.getTextWidth(footer)) / 2, H - 40)

  // Save
  const label = certType === 'belt' ? `${belt}-Belt` : `${belt}-Belt-Stripe-${stripes}`
  doc.save(`${studentName.replace(/\s+/g, '-')}-${label}-Certificate.pdf`)
}
