import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Strip anything that can't be part of a real name:
// - digits and slashes (3/3, 4/5, E/O, 1/1)
// - trailing junk words (owe, ac, res, on hold)
// - parenthetical notes like (5/29) or (On Hold)
// - extra whitespace
function cleanName(raw: string): string {
  return raw
    .trim()
    // Remove parenthetical suffixes like (On Hold), (5/29)
    .replace(/\s*\([^)]*\)\s*$/, '')
    // Remove anything containing digits or slashes from here on
    // Split into words, drop any word that contains a digit or slash
    .split(/\s+/)
    .filter(word => !/[\d\/]/.test(word))
    // Also drop known junk words
    .filter(word => !/^(owe|ac|res|e\/o|eo)$/i.test(word))
    .join(' ')
    .trim()
}

function extractNames(rows: any[][]): string[] {
  const names = new Set<string>()

  for (const row of rows) {
    const cell = row[1] // Column B
    if (!cell) continue
    const raw = String(cell).trim()

    if (!raw || raw.length < 3) continue
    // Skip header/day label rows
    if (/^(student|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(raw)) continue
    // Skip cells that are purely a date or number
    if (/^\d{1,2}\/\d{1,2}$/.test(raw)) continue
    if (/^\d+$/.test(raw)) continue

    const cleaned = cleanName(raw)
    // Must have at least two characters and look like a name (has a letter)
    if (cleaned && cleaned.length >= 2 && /[a-zA-Z]/.test(cleaned)) {
      names.add(cleaned)
    }
  }

  return Array.from(names).sort()
}

export async function GET() {
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
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = read(buffer, { type: 'buffer' })
    const sheetNames = workbook.SheetNames
    const brendanSheet = sheetNames.find(n => n.toLowerCase().includes('brendan'))

    if (!brendanSheet) {
      return NextResponse.json({ sheetNames, brendanSheet: null, names: [] })
    }

    const sheet = workbook.Sheets[brendanSheet]
    const rows: any[][] = utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const names = extractNames(rows)
    return NextResponse.json({ sheetNames, brendanSheet, names })
  }

  if (action === 'parse_sheet') {
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
    const namesRaw = formData.get('names') as string
    const names: string[] = JSON.parse(namesRaw)
    if (!names.length) return NextResponse.json({ error: 'No names provided' }, { status: 400 })

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

    return NextResponse.json({ imported: toInsert.length, skipped: skipped.length, skippedNames: skipped })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
