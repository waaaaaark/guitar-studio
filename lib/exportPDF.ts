'use client'

import { format } from 'date-fns'

type Student = {
  name: string
  email?: string | null
  skill_level: string
  lesson_frequency: string
  start_date: string
  lesson_count: number
}

type Song = { title: string; artist?: string | null }
type Lesson = {
  lesson_date: string
  what_we_covered: string
  focus_for_week: string
  lesson_songs?: { song: Song }[]
}
type RepertoireItem = { song: Song; first_worked_on: string }

export async function exportStudentPDF(
  student: Student,
  lessons: Lesson[],
  repertoire: RepertoireItem[]
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })

  const PAGE_W = 612
  const PAGE_H = 792
  const MARGIN = 52
  const CONTENT_W = PAGE_W - MARGIN * 2
  const LINE_H = 16

  // Colors
  const C_BG = '#f7f5f0'
  const C_ACCENT = '#8b6914'
  const C_TEXT = '#1a1814'
  const C_MUTED = '#8a8278'
  const C_BORDER = '#e2ddd5'
  const C_HIGHLIGHT = '#fdf8ee'

  let y = 0

  function newPage() {
    doc.addPage()
    y = MARGIN
    // subtle top border
    doc.setDrawColor(C_BORDER)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, 44, PAGE_W - MARGIN, 44)
  }

  function checkSpace(needed: number) {
    if (y + needed > PAGE_H - MARGIN) newPage()
  }

  function setFont(style: 'normal' | 'bold' | 'italic', size: number, color = C_TEXT) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(color)
  }

  function drawWrappedText(text: string, x: number, startY: number, maxW: number, lineH: number): number {
    const lines = doc.splitTextToSize(text, maxW)
    for (const line of lines) {
      checkSpace(lineH + 4)
      doc.text(line, x, y)
      y += lineH
    }
    return y
  }

  function label(text: string) {
    setFont('normal', 8, C_MUTED)
    doc.text(text.toUpperCase(), MARGIN, y)
    y += 14
  }

  // ── Cover / Header ──────────────────────────────────────
  // Warm bg strip
  doc.setFillColor(C_BG)
  doc.rect(0, 0, PAGE_W, 120, 'F')
  doc.setDrawColor(C_BORDER)
  doc.setLineWidth(0.5)
  doc.line(0, 120, PAGE_W, 120)

  // Studio label
  setFont('normal', 9, C_MUTED)
  doc.text('GUITAR STUDIO', MARGIN, 42)

  // Student name
  setFont('bold', 26, C_TEXT)
  doc.text(student.name, MARGIN, 72)

  // Meta line
  setFont('normal', 10, C_MUTED)
  const tenure = format(new Date(student.start_date + 'T12:00:00'), 'MMMM yyyy')
  const metaParts = [
    `Student since ${tenure}`,
    `${student.lesson_count} lessons`,
    student.skill_level,
    student.lesson_frequency,
  ]
  doc.text(metaParts.join('  ·  '), MARGIN, 90)

  // Export date
  setFont('normal', 8, C_MUTED)
  doc.text(`Exported ${format(new Date(), 'MMMM d, yyyy')}`, PAGE_W - MARGIN, 42, { align: 'right' })

  y = 148

  // ── Repertoire section ──────────────────────────────────
  if (repertoire.length > 0) {
    checkSpace(40)
    setFont('bold', 11, C_ACCENT)
    doc.text('REPERTOIRE', MARGIN, y)
    y += 20

    const cols = 2
    const colW = CONTENT_W / cols
    repertoire.forEach((item, i) => {
      if (i % cols === 0) checkSpace(LINE_H + 4)
      const col = i % cols
      const x = MARGIN + col * colW
      if (i % cols === 0 && i > 0) y += 0 // already moved

      setFont('normal', 10, C_TEXT)
      doc.text(item.song.title, x, y)
      if (item.song.artist) {
        setFont('normal', 9, C_MUTED)
        const titleW = doc.getTextWidth(item.song.title) + 5
        doc.text(`— ${item.song.artist}`, x + titleW, y)
      }
      if (col === cols - 1 || i === repertoire.length - 1) y += LINE_H
    })

    y += 12
    doc.setDrawColor(C_BORDER)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 20
  }

  // ── Lessons ─────────────────────────────────────────────
  if (lessons.length > 0) {
    checkSpace(40)
    setFont('bold', 11, C_ACCENT)
    doc.text('LESSON HISTORY', MARGIN, y)
    y += 22

    for (const lesson of lessons) {
      checkSpace(80)

      // Date header
      setFont('bold', 11, C_TEXT)
      doc.text(format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy'), MARGIN, y)
      y += 18

      // What we covered
      label('What we covered')
      setFont('normal', 10, C_TEXT)
      drawWrappedText(lesson.what_we_covered, MARGIN, y, CONTENT_W, LINE_H)
      y += 6

      // Focus box
      checkSpace(50)
      const focusLines = doc.splitTextToSize(lesson.focus_for_week, CONTENT_W - 24)
      const focusH = focusLines.length * LINE_H + 24
      doc.setFillColor(C_HIGHLIGHT)
      doc.setDrawColor('#e8d9b0')
      doc.setLineWidth(0.5)
      doc.roundedRect(MARGIN, y, CONTENT_W, focusH, 4, 4, 'FD')

      setFont('normal', 8, C_ACCENT)
      doc.text('FOCUS THIS WEEK', MARGIN + 12, y + 14)

      setFont('normal', 10, C_TEXT)
      let fy = y + 26
      for (const line of focusLines) {
        doc.text(line, MARGIN + 12, fy)
        fy += LINE_H
      }
      y += focusH + 8

      // Songs
      const songs = lesson.lesson_songs?.map(ls => ls.song) || []
      if (songs.length > 0) {
        label('Songs')
        setFont('normal', 10, C_TEXT)
        const songStr = songs.map(s => s.artist ? `${s.title} — ${s.artist}` : s.title).join('  ·  ')
        drawWrappedText(songStr, MARGIN, y, CONTENT_W, LINE_H)
        y += 4
      }

      // Divider between lessons
      y += 10
      doc.setDrawColor(C_BORDER)
      doc.setLineWidth(0.5)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      y += 18
    }
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    setFont('normal', 8, C_MUTED)
    doc.text(`${i} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 28, { align: 'right' })
    doc.text('Guitar Studio', MARGIN, PAGE_H - 28)
  }

  const filename = `${student.name.replace(/\s+/g, '-')}-lesson-history.pdf`
  doc.save(filename)
}
