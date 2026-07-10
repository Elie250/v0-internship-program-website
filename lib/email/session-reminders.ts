import { Resend } from 'resend'
import { COMPANY } from '@/lib/company/constants'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  return key ? new Resend(key) : null
}

const from = process.env.EMAIL_FROM ?? 'Energy & Logics <noreply@energyandlogics.com>'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.energyandlogics.com'

function reminderEmail(title: string, when: string, link: string | null, body: string) {
  const linkBlock = link
    ? `<p><a href="${link}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Open session</a></p>`
    : `<p><a href="${appUrl}/student/dashboard?tab=webinars" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Student dashboard</a></p>`
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px">
<h1 style="color:#1e3a5f;font-size:20px">${title}</h1>
<p>${body}</p>
<p><strong>When:</strong> ${when}</p>
${linkBlock}
<p style="margin-top:24px;font-size:13px;color:#64748b">${COMPANY.brandName}</p>
</body></html>`
}

export async function sendSessionReminders(): Promise<{ sent: number; skipped: boolean }> {
  const resend = getResend()
  if (!resend || !supabaseAdmin) {
    return { sent: 0, skipped: true }
  }

  const now = Date.now()
  const windows = [
    { type: '24h' as const, minMs: 23 * 3_600_000, maxMs: 25 * 3_600_000 },
    { type: '1h' as const, minMs: 45 * 60_000, maxMs: 75 * 60_000 },
  ]

  let sent = 0

  for (const window of windows) {
    const minTime = new Date(now + window.minMs).toISOString()
    const maxTime = new Date(now + window.maxMs).toISOString()

    const { data: sessions } = await supabaseAdmin
      .from('course_sessions')
      .select('id, topic, scheduled_at, meeting_link, course_id, courses(title)')
      .gte('scheduled_at', minTime)
      .lte('scheduled_at', maxTime)

    for (const session of sessions ?? []) {
      const { data: already } = await supabaseAdmin
        .from('session_reminder_log')
        .select('id')
        .eq('session_id', session.id)
        .eq('reminder_type', window.type)
        .maybeSingle()

      if (already) continue

      const course = Array.isArray(session.courses) ? session.courses[0] : session.courses
      const courseTitle = (course as { title?: string } | null)?.title ?? 'Your programme'

      const { data: enrollments } = await supabaseAdmin
        .from('course_enrollments')
        .select('applicant_email, applicant_name')
        .eq('course_id', session.course_id)
        .eq('status', 'admitted')

      const when = new Date(String(session.scheduled_at)).toLocaleString('en-GB', {
        dateStyle: 'full',
        timeStyle: 'short',
      })

      for (const row of enrollments ?? []) {
        const email = String(row.applicant_email ?? '').trim()
        if (!email) continue
        try {
          await resend.emails.send({
            from,
            to: email,
            subject: `Reminder: ${session.topic} starts ${window.type === '24h' ? 'tomorrow' : 'soon'}`,
            html: reminderEmail(
              `Live class reminder — ${courseTitle}`,
              when,
              session.meeting_link as string | null,
              `Dear ${row.applicant_name ?? 'Student'}, your class <strong>${session.topic}</strong> is coming up.`
            ),
          })
          sent++
        } catch (e) {
          console.error('[session-reminder]', e)
        }
      }

      await supabaseAdmin.from('session_reminder_log').insert({
        session_id: session.id,
        reminder_type: window.type,
      })
    }

    const { data: webinars } = await supabaseAdmin
      .from('webinars')
      .select('id, title, scheduled_at, meeting_link')
      .eq('status', 'published')
      .gte('scheduled_at', minTime)
      .lte('scheduled_at', maxTime)

    for (const webinar of webinars ?? []) {
      const { data: already } = await supabaseAdmin
        .from('session_reminder_log')
        .select('id')
        .eq('webinar_id', webinar.id)
        .eq('reminder_type', window.type)
        .maybeSingle()

      if (already) continue

      const { data: students } = await supabaseAdmin
        .from('course_enrollments')
        .select('applicant_email, applicant_name')
        .eq('status', 'admitted')

      const seen = new Set<string>()
      const when = new Date(String(webinar.scheduled_at)).toLocaleString('en-GB', {
        dateStyle: 'full',
        timeStyle: 'short',
      })

      for (const row of students ?? []) {
        const email = String(row.applicant_email ?? '').trim().toLowerCase()
        if (!email || seen.has(email)) continue
        seen.add(email)
        try {
          await resend.emails.send({
            from,
            to: email,
            subject: `Webinar reminder: ${webinar.title}`,
            html: reminderEmail(
              `Webinar — ${webinar.title}`,
              when,
              webinar.meeting_link as string | null,
              `Dear ${row.applicant_name ?? 'Student'}, don't miss this upcoming webinar.`
            ),
          })
          sent++
        } catch (e) {
          console.error('[webinar-reminder]', e)
        }
      }

      await supabaseAdmin.from('session_reminder_log').insert({
        webinar_id: webinar.id,
        reminder_type: window.type,
      })
    }
  }

  return { sent, skipped: false }
}
