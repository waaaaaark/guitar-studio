import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authed = await checkAdminAuth()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { student_id } = await req.json()

  const [{ data: student }, { data: settings }] = await Promise.all([
    supabase.from('students').select('*').eq('id', student_id).single(),
    supabase.from('app_settings').select('*').eq('id', 1).single(),
  ])

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  if (!student.email) return NextResponse.json({ error: 'No email on file' }, { status: 400 })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const studioName: string = settings?.studio_name || "Brendan's Guitar Studio"
  const studentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${student.token}`
  const displayName = student.name.replace(/__test__/g, '').trim()
  const firstName = displayName.split(' ')[0]
  const isChild = student.student_profile === 'Child'
  const isTeen = student.student_profile === 'Teen'
  const isAdult = student.student_profile === 'Adult'
  const beltActive = student.belt_system_active

  const defaultIntro = settings?.onboarding_email_intro || "I've set up a page for you to track our lesson notes, songs, and resources."
  const defaultClosing = settings?.onboarding_email_closing || "Bookmark this link — it's yours and doesn't require any login. See you at our next lesson!"

  function applyTokens(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
      const map: Record<string, string> = { name: firstName, url: studentUrl, studio: studioName }
      return map[key] || ''
    })
  }

  const greeting = isChild
    ? `Hey ${firstName}! 🎸`
    : isTeen
    ? `Hey ${firstName},`
    : `Hi ${firstName},`

  const introLine = isChild
    ? `Welcome to ${studioName}! This is your very own music page where you can see everything we work on together.`
    : isTeen
    ? `Welcome to your personal lesson hub for ${studioName}.`
    : applyTokens(defaultIntro)

  const tabsExplain = isAdult
    ? `Your page has a few sections: <strong>Lessons</strong> shows your notes from each session and your song repertoire. <strong>Practice</strong> is where you can log practice time and mark songs you've been working on. <strong>Resources</strong> is where I'll share any materials relevant to your playing.`
    : `Your page has a few sections:<br>
      <strong>Lessons</strong> — your notes from each session, songs we've played, and your full repertoire.<br>
      <strong>Practice</strong> — log your practice time and mark songs you've been working on.<br>
      <strong>Resources</strong> — materials I'll share with you as we go.`

  const beltSection = beltActive ? (isAdult
    ? `<p>I also use a <strong>belt progression system</strong> — similar to martial arts — to track your development as a guitarist. As you practice consistently and demonstrate skills in lessons, you'll earn stripes and progress through belts from White to Black. It's a long-term journey that reflects real growth.</p>`
    : isChild
    ? `<p>🥋 <strong>The Belt System!</strong><br>Just like karate, you'll earn belts as you get better at guitar! You start as a <strong>White Belt</strong> and can work your way all the way up to <strong>Black Belt</strong>. Practice earns you XP, and when you nail a song I can give you a big XP bonus. Keep an eye on your Belt tab to see your progress!</p>`
    : `<p>🎸 <strong>The Belt System</strong><br>I use a belt progression system (think jiu jitsu, but for guitar) to track your progress. You'll earn XP through practice and song mastery, and as you develop your skills I'll promote you through the belts. Check the Belt tab to see where you're at and what you're working toward.</p>`
  ) : ''

  const bookmarkLine = isChild
    ? `Save this link or ask a parent to bookmark it for you!`
    : applyTokens(defaultClosing)

  const subject = isChild
    ? `Welcome to ${studioName}, ${firstName}! 🎸`
    : `Your ${studioName} page is ready`

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
    .header { background: #1a1814; padding: 28px 28px 22px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #c8a96e; margin-bottom: 10px; }
    .header h1 { font-size: 24px; font-weight: 600; color: #f0ece4; margin-bottom: 4px; }
    .body { padding: 28px 28px 24px; }
    p { color: #2a2622; line-height: 1.75; font-size: 15px; margin-bottom: 16px; }
    .link-box { background: #f5f0e6; border: 1px solid #e8d9b0; border-left: 3px solid #c8a96e; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
    .link-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8b6914; margin-bottom: 6px; }
    .link-box a { color: #8b6914; font-size: 14px; word-break: break-all; text-decoration: none; font-weight: 500; }
    .divider { border: none; border-top: 1px solid #e2ddd5; margin: 20px 0; }
    .footer { color: #6b6560; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="eyebrow">${studioName}</div>
      <h1>${greeting}</h1>
    </div>
    <div class="body">
      <p>${introLine}</p>
      <p>${tabsExplain}</p>
      ${beltSection}
      <div class="link-box">
        <div class="label">Your personal page</div>
        <a href="${studentUrl}">${studentUrl}</a>
      </div>
      <p>${bookmarkLine}</p>
      <hr class="divider">
      <div class="footer">Your page updates after each lesson.</div>
    </div>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || `${studioName} <lessons@yourdomain.com>`,
    to: student.email,
    subject,
    html,
  })

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
