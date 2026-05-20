'use client'

import { format } from 'date-fns'

type Student = {
  name: string
  email?: string | null
  start_date: string
  lesson_count: number
  skill_level: string
}

type Song = { title: string; artist?: string | null }
type Lesson = {
  lesson_date: string
  what_we_covered: string
  focus_for_week: string
  lesson_songs?: { song: Song }[]
}
type RepertoireItem = {
  song: Song
  first_worked_on: string
  mastery_status?: string
}

export type ExportMode = 'songs' | 'lessons' | 'both'

// ── Shared helpers ──────────────────────────────────────────────────────────

function pageHeader(doc: any, studentName: string, pageLabel: string, W: number, MARGIN: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(26, 24, 20)
  doc.text(studentName, MARGIN, 38)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(140, 130, 120)
  doc.text(pageLabel, MARGIN, 52)
  doc.text(`Exported ${format(new Date(), 'MMM d, yyyy')}`, W - MARGIN, 52, { align: 'right' })

  doc.setDrawColor(220, 215, 208)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, 58, W - MARGIN, 58)

  return 70 // starting Y after header
}

function addPageNumbers(doc: any, W: number, H: number, MARGIN: number) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(180, 170, 160)
    doc.text(`${i} / ${total}`, W - MARGIN, H - 18, { align: 'right' })
    doc.text('Guitar Studio', MARGIN, H - 18)
  }
}

// ── Song list export ────────────────────────────────────────────────────────

function buildSongList(doc: any, student: Student, repertoire: RepertoireItem[]) {
  const W = 612, H = 792, MARGIN = 48
  const COL_W = (W - MARGIN * 2 - 12) / 2
  let y = pageHeader(doc, student.name, `Song Repertoire · ${repertoire.length} songs`, W, MARGIN)

  // Two columns
  const col1X = MARGIN
  const col2X = MARGIN + COL_W + 12

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(140, 130, 120)
  doc.text('SONG / ARTIST', col1X, y)
  doc.text('SONG / ARTIST', col2X, y)
  doc.text('DATE', col1X + COL_W - 30, y, { align: 'right' })
  doc.text('DATE', col2X + COL_W - 30, y, { align: 'right' })
  y += 6
  doc.setDrawColor(220, 215, 208)
  doc.setLineWidth(0.3)
  doc.line(col1X, y, col1X + COL_W - 30, y)
  doc.line(col2X, y, col2X + COL_W - 30, y)
  y += 10

  const ROW_H = 22
  repertoire.forEach((item, i) => {
    const col = i % 2
    const x = col === 0 ? col1X : col2X
    if (col === 0 && i > 0) y += ROW_H
    if (y > H - MARGIN - ROW_H) {
      doc.addPage()
      y = pageHeader(doc, student.name, 'Song Repertoire (continued)', W, MARGIN)
      y += 10
    }

    const mastered = item.mastery_status === 'mastered'
    doc.setFont('helvetica', mastered ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(mastered ? 60 : 40, mastered ? 100 : 40, mastered ? 60 : 40)

    const titleMaxW = COL_W - 46
    const title = doc.splitTextToSize(item.song.title, titleMaxW)[0]
    doc.text((mastered ? '✓ ' : '') + title, x, y)

    if (item.song.artist) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(140, 130, 120)
      doc.text(item.song.artist, x + 8, y + 9)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(160, 150, 140)
    doc.text(
      format(new Date(item.first_worked_on + 'T12:00:00'), 'MMM yy'),
      x + COL_W - 30, y, { align: 'right' }
    )

    if (col === 1 || i === repertoire.length - 1) {
      // separator line
      doc.setDrawColor(235, 232, 226)
      doc.setLineWidth(0.2)
      doc.line(col1X, y + 14, col1X + COL_W - 30, y + 14)
      doc.line(col2X, y + 14, col2X + COL_W - 30, y + 14)
    }
  })
}

// ── Lesson notes export ─────────────────────────────────────────────────────

function buildLessonNotes(doc: any, student: Student, lessons: Lesson[], isNewDoc = true) {
  const W = 612, H = 792, MARGIN = 48, LINE_H = 13
  let y = pageHeader(doc, student.name, `Lesson Notes · ${lessons.length} lessons`, W, MARGIN)

  function checkSpace(needed: number) {
    if (y + needed > H - MARGIN) {
      doc.addPage()
      y = pageHeader(doc, student.name, 'Lesson Notes (continued)', W, MARGIN)
    }
  }

  function wrapText(text: string, x: number, maxW: number, lineH: number) {
    const lines = doc.splitTextToSize(text, maxW)
    for (const line of lines) {
      checkSpace(lineH)
      doc.text(line, x, y)
      y += lineH
    }
  }

  lessons.forEach((lesson, i) => {
    checkSpace(60)

    // Date header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(26, 24, 20)
    doc.text(format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy'), MARGIN, y)
    y += 14

    // What we covered
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 130, 120)
    doc.text('COVERED', MARGIN, y)
    y += 9
    doc.setTextColor(50, 45, 40)
    doc.setFontSize(9)
    wrapText(lesson.what_we_covered, MARGIN + 6, W - MARGIN * 2 - 6, LINE_H)
    y += 2

    // Focus
    checkSpace(30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 130, 120)
    doc.text('FOCUS', MARGIN, y)
    y += 9
    doc.setTextColor(50, 45, 40)
    doc.setFontSize(9)
    wrapText(lesson.focus_for_week, MARGIN + 6, W - MARGIN * 2 - 6, LINE_H)
    y += 2

    // Songs
    const songs = lesson.lesson_songs?.map(ls => ls.song) || []
    if (songs.length > 0) {
      checkSpace(16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(140, 130, 120)
      doc.text('SONGS', MARGIN, y)
      y += 9
      doc.setTextColor(80, 120, 80)
      const songStr = songs.map(s => s.artist ? `${s.title} — ${s.artist}` : s.title).join('  ·  ')
      wrapText(songStr, MARGIN + 6, W - MARGIN * 2 - 6, LINE_H)
    }

    // Separator
    if (i < lessons.length - 1) {
      y += 6
      checkSpace(8)
      doc.setDrawColor(225, 220, 212)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y, W - MARGIN, y)
      y += 10
    }
  })
}

// ── Main export function ────────────────────────────────────────────────────

export async function exportStudentPDF(
  student: Student,
  lessons: Lesson[],
  repertoire: RepertoireItem[],
  mode: ExportMode = 'both'
) {
  const { jsPDF } = await import('jspdf')
  const W = 612, H = 792, MARGIN = 48

  const doc = new jsPDF({ unit: 'pt', format: 'letter' })

  if (mode === 'songs' || mode === 'both') {
    buildSongList(doc, student, repertoire)
  }

  if (mode === 'lessons' || mode === 'both') {
    if (mode === 'both') doc.addPage()
    buildLessonNotes(doc, student, lessons, mode === 'lessons')
  }

  addPageNumbers(doc, W, H, MARGIN)

  const label = mode === 'songs' ? 'Songs' : mode === 'lessons' ? 'Lessons' : 'Full-Export'
  doc.save(`${student.name.replace(/\s+/g, '-')}-${label}.pdf`)
}
