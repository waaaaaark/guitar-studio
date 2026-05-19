import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Clean junk from student name cells
// e.g. "Rory O Reilly 3/3" -> "Rory O Reilly"
// "Carrie Keasler 3/3 owe" -> "Carrie Keasler"
// "Michael Green 3/3 E/O (5/29)" -> "Michael Green"
// "Jam (On Hold)" -> "Jam (On Hold)" -- kept as-is, user can deselect
function cleanName(raw: string): string {
  return raw
    .trim()
    // Remove trailing date patterns like 3/3, 4/5, 1/1
    .replace(/\s+\d+\/\d+(\s+E\/O)?(\s+\([^)]+\))?$/, '')
    // Remove trailing "owe", "ac", parenthetical notes
    .replace(/\s+(owe|ac|res|E\/O)(\s.*)?$/i, '')
    .trim()
}

// Parse sheet tab, extract unique student names from column B
function extractNames(rows: any[][]): string[] {
  const names = new Set<string>()

  for (const row of rows) {
    const cell = row[1] // Column B (0-indexed)
    if (!cell) continue
    const raw = String(cell).trim()

    // Skip header rows, day labels, empty, purely numeric
    if (!raw) continue
    if (/^(student|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(raw)) continue
    if (/^\d{1,2}\/\d{1,2}$/.test(raw)) continue // pure dates
    if (raw.length < 3) continue

    const cleaned = cleanName(raw)
    if (cleaned && cleaned.length > 2) names.add(cleaned)
  }

  return Array.from(names).sort()
}

// Parse xlsx: returns list of sheet names
export async function GET(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const action = formData.get('action') as string

  const { read, utils } = await import('xlsx')

  if (action === 'parse') {
    // Step 1: parse the file, return sheet names + names from Brendan's tab
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = read(buffer, { type: 'buffer' })

    const sheetNames = workbook.SheetNames

    // Try to find Brendan's sheet automatically
    const brendanSheet = sheetNames.find(n =>
      n.toLowerCase().includes('brendan')
    )

    if (!brendanSheet) {
      return NextResponse.json({ sheetNames, brendanSheet: null, names: [] })
    }

    const sheet = workbook.Sheets[brendanSheet]
    const rows: any[][] = utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const names = extractNames(rows)

    return NextResponse.json({ sheetNames, brendanSheet, names })
  }

  if (action === 'parse_sheet') {
    // Parse a specific sheet by name
    const file = formData.get('file') as File
    const sheetName = formData.get('sheetName') as string
    if (!file || !sheetName) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })

    const rows: any[][] = utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const names = extractNames(rows)
    return NextResponse.json({ names })
  }

  if (action === 'import') {
    // Step 2: import selected names as students
    const namesRaw = formData.get('names') as string
    const names: string[] = JSON.parse(namesRaw)

    if (!names.length) return NextResponse.json({ error: 'No names provided' }, { status: 400 })

    // Get existing student names to avoid duplicates
    const { data: existing } = await supabase.from('students').select('name')
    const existingNames = new Set((existing || []).map((s: any) => s.name.toLowerCase()))

    const toInsert = names
      .filter(name => !existingNames.has(name.toLowerCase()))
      .map(name => ({
        name,
        skill_level: 'Beginner',
        lesson_frequency: 'Weekly',
        start_date: new Date().toISOString().split('T')[0],
        active: true,
      }))

    const skipped = names.filter(name => existingNames.has(name.toLowerCase()))

    if (toInsert.length > 0) {
      const { error } = await supabase.from('students').insert(toInsert)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      imported: toInsert.length,
      skipped: skipped.length,
      skippedNames: skipped,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
