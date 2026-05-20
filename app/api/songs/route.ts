import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: songs, error } = await supabase
    .from('songs')
    .select(`
      *,
      song_tags(tag),
      student_songs(
        student_id,
        mastery_status,
        student:students(id, name, active)
      )
    `)
    .order('title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten tags array
  const normalized = (songs || []).map((s: any) => ({
    ...s,
    tags: (s.song_tags || []).map((t: any) => t.tag),
  }))

  return NextResponse.json(normalized)
}

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('songs')
    .upsert({ title: body.title, artist: body.artist || null }, { onConflict: 'title,artist' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add tags if provided
  if (body.tags?.length && data) {
    await supabase.from('song_tags').insert(
      body.tags.map((tag: string) => ({ song_id: data.id, tag: tag.trim().toLowerCase() }))
    )
  }

  return NextResponse.json({ ...data, tags: body.tags || [] })
}
