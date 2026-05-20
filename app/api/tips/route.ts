import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - random tip for student, or all tips for admin
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') // 'random' | 'all'

  if (mode === 'random') {
    const { data } = await supabase
      .from('practice_tips')
      .select('id, tip_text')
      .eq('active', true)

    if (!data || data.length === 0) {
      return NextResponse.json({ tip_text: 'Practice makes permanent — make it count!' })
    }

    const random = data[Math.floor(Math.random() * data.length)]
    return NextResponse.json(random)
  }

  // Admin: all tips
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('practice_tips')
    .select('*')
    .order('created_at', { ascending: true })

  return NextResponse.json(data || [])
}

// POST - add a tip (admin)
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tip_text } = await req.json()
  if (!tip_text?.trim()) return NextResponse.json({ error: 'tip_text required' }, { status: 400 })

  const { data, error } = await supabase
    .from('practice_tips')
    .insert({ tip_text: tip_text.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH - edit a tip (admin)
export async function PATCH(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, tip_text, active } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = {}
  if (tip_text !== undefined) update.tip_text = tip_text.trim()
  if (active !== undefined) update.active = active

  const { data, error } = await supabase
    .from('practice_tips')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - remove a tip (admin)
export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await supabase.from('practice_tips').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
