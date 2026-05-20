import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET all unique tags (for autocomplete)
export async function GET() {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('song_tags')
    .select('tag')
    .order('tag')

  const unique = [...new Set((data || []).map((r: any) => r.tag))]
  return NextResponse.json(unique)
}

// POST add a tag to a song
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { song_id, tag } = await req.json()
  if (!song_id || !tag?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase
    .from('song_tags')
    .upsert({ song_id, tag: tag.trim().toLowerCase() }, { onConflict: 'song_id,tag' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE remove a tag from a song
export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { song_id, tag } = await req.json()
  await supabase.from('song_tags').delete()
    .eq('song_id', song_id).eq('tag', tag)

  return NextResponse.json({ ok: true })
}
