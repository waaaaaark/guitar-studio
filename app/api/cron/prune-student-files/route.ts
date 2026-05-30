import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: expired } = await supabase
    .from('student_files')
    .select('id, file_path')
    .lt('expires_at', new Date().toISOString())

  if (!expired?.length) return NextResponse.json({ pruned: 0 })

  await supabase.storage.from('student-files').remove(expired.map(f => f.file_path))
  await supabase.from('student_files').delete().in('id', expired.map(f => f.id))

  return NextResponse.json({ pruned: expired.length })
}
