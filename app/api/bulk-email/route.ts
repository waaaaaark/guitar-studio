import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_ids, subject, body } = await req.json()
  if (!student_ids?.length || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, name, email, token')
    .in('id', student_ids)
    .not('email', 'is', null)

  if (!students?.length) return NextResponse.json({ error: 'No students with emails found' }, { status: 400 })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const results = { sent: 0, failed: 0, failedNames: [] as string[] }

  for (const student of students) {
    if (!student.email) continue
    const displayName = student.name.replace(/__test__/g, '').trim()
    const studentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${student.token}`

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
    .header h1 { font-size: 20px; font-weight: 600; color: #f0ece4; }
    .body { padding: 24px 28px; }
    .greeting { font-size: 16px; color: #2a2622; margin-bottom: 16px; }
    .content { color: #2a2622; line-height: 1.8; font-size: 15px; white-space: pre-wrap; }
    .divider { border: none; border-top: 1px solid #e2ddd5; margin: 20px 0; }
    .footer { color: #6b6560; font-size: 13px; line-height: 1.6; }
    .footer a { color: #8b6914; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="eyebrow">Guitar Studio</div>
      <h1>${subject}</h1>
    </div>
    <div class="body">
      <div class="greeting">Hey ${displayName},</div>
      <div class="content">${body}</div>
      <hr class="divider">
      <div class="footer">
        View your lesson notes and progress:<br>
        <a href="${studentUrl}">${studentUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>`

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Guitar Studio <lessons@yourdomain.com>',
      to: student.email,
      subject,
      html,
    })

    if (error) {
      results.failed++
      results.failedNames.push(displayName)
    } else {
      results.sent++
    }
  }

  return NextResponse.json(results)
}
