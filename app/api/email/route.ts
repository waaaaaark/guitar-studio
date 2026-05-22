import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] || '')
}

function cleanDisplayName(name: string): string {
  return name.replace(/__test__/g, '').trim()
}

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lesson_id } = await req.json()

  const [lessonRes, settingsRes] = await Promise.all([
    supabase
      .from('lessons')
      .select(`*, lesson_songs(song:songs(*)), student:students(*)`)
      .eq('id', lesson_id)
      .single(),
    supabase.from('app_settings').select('*').eq('id', 1).single(),
  ])

  const lesson = lessonRes.data
  const settings = settingsRes.data

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  if (!lesson.student?.email) return NextResponse.json({ error: 'Student has no email' }, { status: 400 })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const studioName = settings?.studio_name || "Brendan's Guitar Studio"
  const studentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${lesson.student.token}`
  const lessonDate = format(new Date(lesson.lesson_date + 'T12:00:00'), 'MMMM d, yyyy')
  const displayName = cleanDisplayName(lesson.student.name)
  const firstName = displayName.split(' ')[0]

  const tokens = {
    name: firstName,
    url: studentUrl,
    date: lessonDate,
    studio: studioName,
  }

  const introText = applyTokens(
    settings?.lesson_email_intro || "Here's a summary of what we worked on today.",
    tokens
  )
  const closingText = applyTokens(
    settings?.lesson_email_closing || "Keep practicing and I'll see you next time!",
    tokens
  )

  const songs = lesson.lesson_songs?.map((ls: any) => {
    const title = ls.song.title.replace(/__test__/g, '').trim()
    return ls.song.artist ? `${title} — ${ls.song.artist}` : title
  }) || []

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f3ef; color: #1a1814; padding: 24px 16px; }
    .wrap { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2ddd5; }
    .header { background: #1a1814; padding: 24px 28px 20px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #c8a96e; margin-bottom: 10px; }
    .header h1 { font-size: 22px; font-weight: 600; color: #f0ece4; margin-bottom: 4px; }
    .header .date { font-size: 14px; color: #9a9588; }
    .body { padding: 24px 28px; }
    .intro { color: #2a2622; line-height: 1.7; font-size: 15px; margin-bottom: 20px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b6560; margin-bottom: 8px; font-weight: 600; }
    .content { color: #2a2622; line-height: 1.7; font-size: 15px; white-space: pre-wrap; margin-bottom: 20px; }
    .focus-box { background: #fdf8ee; border: 1px solid #e8d9b0; border-left: 3px solid #c8a96e; border-radius: 6px; padding: 16px 18px; margin-bottom: 20px; }
    .focus-box .label { color: #8b6914; }
    .focus-box .content { color: #1a1814; margin-bottom: 0; }
    .song-tag { background: #f5f0e6; color: #6b4f10; border: 1px solid #ddd0b0; border-radius: 20px; padding: 4px 12px; font-size: 13px; display: inline-block; margin: 2px; }
    .divider { border: none; border-top: 1px solid #e2ddd5; margin: 20px 0; }
    .closing { color: #2a2622; line-height: 1.7; font-size: 15px; margin-bottom: 16px; }
    .footer { color: #6b6560; font-size: 13px; line-height: 1.6; }
    .footer a { color: #8b6914; text-decoration: none; word-break: break-all; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="eyebrow">${studioName} · Lesson Notes</div>
      <h1>Hey ${firstName},</h1>
      <div class="date">${lessonDate}</div>
    </div>
    <div class="body">
      <p class="intro">${introText}</p>

      <div class="label">What we covered</div>
      <div class="content">${lesson.what_we_covered}</div>

      <div class="focus-box">
        <div class="label">Focus this week</div>
        <div class="content">${lesson.focus_for_week}</div>
      </div>

      ${songs.length > 0 ? `
      <div class="label">Songs this lesson</div>
      <div style="margin-bottom:20px">${songs.map((s: string) => `<span class="song-tag">${s}</span>`).join(' ')}</div>
      ` : ''}

      <hr class="divider">
      <p class="closing">${closingText}</p>
      <div class="footer">
        View your full lesson history:<br>
        <a href="${studentUrl}">${studentUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || `${studioName} <lessons@yourdomain.com>`,
    to: lesson.student.email,
    subject: `Lesson notes — ${lessonDate}`,
    html,
  })

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
