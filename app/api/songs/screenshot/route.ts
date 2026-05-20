import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'

const PROMPT = [
  'This is a screenshot from the Ultimate Guitar app showing a song list or library.',
  'The UI may have a dark or light background — both are fine.',
  'Extract every song entry visible in this screenshot.',
  'For each song: the title is usually the larger or bolder text, the artist is the smaller text below it.',
  'Ignore all UI elements: buttons, nav bars, tabs, ratings, difficulty, icons, ads, search bars.',
  'Return ONLY a valid JSON array, nothing else — no explanation, no markdown, no code fences:',
  '[{"title":"Song Title","artist":"Artist Name"},{"title":"Another Song","artist":"Another Artist"}]',
  'If no songs are visible or readable, return exactly: []',
].join(' ')

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in environment variables' }, { status: 500 })
  }

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

  const allSongs: { title: string; artist: string }[] = []

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = (file.type && file.type.startsWith('image/')) ? file.type : 'image/jpeg'

    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Claude API error:', response.status, errText)
      return NextResponse.json({
        error: `AI API error ${response.status} — check server logs`,
      }, { status: 500 })
    }

    const data = await response.json()
    const text: string = (data.content || [])
      .map((c: any) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim()

    try {
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) {
        for (const s of parsed) {
          if (s && typeof s.title === 'string' && s.title.trim()) {
            allSongs.push({ title: s.title.trim(), artist: (s.artist || '').trim() })
          }
        }
      }
    } catch (e) {
      console.error('JSON parse error. Raw text:', text.slice(0, 300))
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = allSongs.filter(s => {
    const key = `${s.title.toLowerCase()}|||${s.artist.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return NextResponse.json({ songs: unique, count: unique.length })
}
