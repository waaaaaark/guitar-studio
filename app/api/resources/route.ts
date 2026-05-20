import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'resources'

// GET all resources (admin) or assigned resources for a student (by token)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  // Student-facing: return only their assigned resources
  if (token) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('token', token)
      .single()

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data } = await supabase
      .from('student_resources')
      .select(`*, resource:resources(*)`)
      .eq('student_id', student.id)
      .order('assigned_at', { ascending: false })

    return NextResponse.json(data || [])
  }

  // Admin: return all resources with assignment counts
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('resources')
    .select(`*, student_resources(student_id)`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST create a new resource (link type)
export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, resource_type, url, tags } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'URL required for link resources' }, { status: 400 })

  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      resource_type: resource_type || 'Other',
      source_type: 'link',
      url: url.trim(),
      tags: tags || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH update a resource
export async function PATCH(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE a resource (also removes from storage if uploaded)
export async function DELETE(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Get resource to check if it has a file to delete
  const { data: resource } = await supabase
    .from('resources')
    .select('file_path, source_type')
    .eq('id', id)
    .single()

  // Delete from storage if it's an upload
  if (resource?.source_type === 'upload' && resource?.file_path) {
    await supabase.storage.from(BUCKET).remove([resource.file_path])
  }

  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
