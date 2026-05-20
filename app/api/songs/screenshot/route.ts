import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

  const allSongs: { title: string; artist: string }[] = []

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = file.type || 'image/jpeg'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `This is a screenshot from Ultimate Guitar showing a song library or favorites list.
Extract every song you can see. For each song return the title and artist.
Ignore any UI elements, buttons, ratings, difficulty indicators, instrument icons, or ads.
Focus only on song titles and artist names.

Return ONLY a JSON array, no other text, no markdown, no explanation:
[{"title":"Song Title","artist":"Artist Name"},...]

If you cannot determine the artist, use empty string "".
If the image doesn't show songs, return [].`
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text())
      continue
    }

    const data = await response.json()
    const text = data.content?.map((c: any) => c.text || '').join('') || ''

    try {
      // Strip any markdown if present
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      const songs = JSON.parse(clean)
      if (Array.isArray(songs)) {
        allSongs.push(...songs.filter((s: any) => s.title && typeof s.title === 'string'))
      }
    } catch (e) {
      console.error('JSON parse error:', e, 'Raw text:', text)
    }
  }

  // Deduplicate by title+artist
  const seen = new Set<string>()
  const unique = allSongs.filter(s => {
    const key = `${s.title.toLowerCase()}|||${(s.artist || '').toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return NextResponse.json({ songs: unique, count: unique.length })
}
