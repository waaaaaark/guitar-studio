import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lesson_id } = await req.json()

  const { data: lesson } = await supabase
    .from('lessons')
    .select(`*, lesson_songs(song:songs(*)), student:students(*)`)
    .eq('id', lesson_id)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  if (!lesson.student?.email) return NextResponse.json({ error: 'Student has no email' }, { status: 400 })

  // Lazy-load Resend so it doesn't blow up at build time
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const studentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${lesson.student.token}`
  const lessonDate = format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')
  const songs = lesson.lesson_songs?.map((ls: any) =>
    ls.song.artist ? `${ls.song.title} — ${ls.song.artist}` : ls.song.title
  ) || []

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #0f0e0c; color: #f0ece4; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #5a5750; margin-bottom: 8px; font-family: -apple-system, sans-serif; }
    h1 { font-size: 22px; font-weight: normal; color: #f0ece4; margin: 0 0 4px; }
    .date { color: #9a9588; font-size: 14px; margin-bottom: 32px; }
    .section { margin-bottom: 28px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a5750; margin-bottom: 10px; font-family: -apple-system, sans-serif; }
    .content { color: #c8c2b8; line-height: 1.7; font-size: 15px; white-space: pre-wrap; }
    .focus-box { background: rgba(200,169,110,0.1); border: 1px solid rgba(200,169,110,0.2); border-radius: 6px; padding: 16px 20px; }
    .focus-box .content { color: #f0ece4; }
    .song-tag { background: rgba(200,169,110,0.12); color: #c8a96e; border: 1px solid rgba(200,169,110,0.25); border-radius: 20px; padding: 4px 12px; font-size: 13px; font-family: -apple-system, sans-serif; display: inline-block; margin: 3px; }
    .divider { border: none; border-top: 1px solid #2e2c28; margin: 24px 0; }
    .footer { color: #5a5750; font-size: 13px; font-family: -apple-system, sans-serif; }
    .footer a { color: #c8a96e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">Guitar Studio · Lesson Notes</div>
    <h1>Hey ${lesson.student.name},</h1>
    <div class="date">${lessonDate}</div>

    <div class="section">
      <div class="label">What we covered</div>
      <div class="content">${lesson.what_we_covered}</div>
    </div>

    <div class="section focus-box">
      <div class="label" style="color: #c8a96e;">Focus this week</div>
      <div class="content">${lesson.focus_for_week}</div>
    </div>

    ${songs.length > 0 ? `
    <div class="section">
      <div class="label">Songs this lesson</div>
      <div>${songs.map((s: string) => `<span class="song-tag">${s}</span>`).join('')}</div>
    </div>
    ` : ''}

    <hr class="divider">

    <div class="footer">
      View your full lesson history and repertoire:<br>
      <a href="${studentUrl}">${studentUrl}</a>
    </div>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Guitar Studio <lessons@yourdomain.com>',
    to: lesson.student.email,
    subject: `Lesson notes — ${lessonDate}`,
    html,
  })

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
