import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET all global requirements
export async function GET() {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('belt_requirements')
    .select('*')
    .order('belt')
    .order('stripe')
    .order('sort_order')

  return NextResponse.json(data || [])
}

// POST add a new global requirement
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { belt, stripe, requirement, sort_order } = await req.json()
  if (!belt || !stripe || !requirement?.trim()) {
    return NextResponse.json({ error: 'belt, stripe, and requirement required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('belt_requirements')
    .insert({ belt, stripe: parseInt(stripe), requirement: requirement.trim(), sort_order: sort_order || 99 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH edit a requirement
export async function PATCH(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, requirement, sort_order } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = {}
  if (requirement !== undefined) update.requirement = requirement.trim()
  if (sort_order !== undefined) update.sort_order = sort_order

  const { data, error } = await supabase
    .from('belt_requirements')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE a requirement
export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('belt_requirements').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
