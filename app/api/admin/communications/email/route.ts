import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail, escapeHtml, emailLayout, getAppUrl } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'

type RecipientMode = 'single' | 'role' | 'all_students' | 'emails'

export async function POST(request: Request) {
  try {
    const session = await requireAdminPermission(PERMISSIONS.USERS_EDIT)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const subject = String(body.subject ?? '').trim()
    const message = String(body.message ?? '').trim()
    const mode = String(body.mode ?? 'single') as RecipientMode
    const userId = body.userId ? String(body.userId) : null
    const role = body.role ? String(body.role) : null
    const rawEmails = Array.isArray(body.emails)
      ? body.emails.map((e: unknown) => String(e).trim()).filter(Boolean)
      : []

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    let recipients: string[] = []

    if (mode === 'single') {
      if (!userId) {
        return NextResponse.json({ error: 'Select a recipient' }, { status: 400 })
      }
      const { data } = await supabaseAdmin.from('users').select('email').eq('id', userId).maybeSingle()
      if (!data?.email) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
      }
      recipients = [data.email]
    } else if (mode === 'role') {
      if (!role) {
        return NextResponse.json({ error: 'Select a role' }, { status: 400 })
      }
      const { data } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('role', role)
        .eq('status', 'active')
      recipients = (data ?? []).map((u) => u.email).filter(Boolean)
    } else if (mode === 'all_students') {
      const { data } = await supabaseAdmin
        .from('users')
        .select('email')
        .in('role', ['student', 'registered'])
        .eq('status', 'active')
      recipients = (data ?? []).map((u) => u.email).filter(Boolean)
    } else if (mode === 'emails') {
      recipients = rawEmails
    } else {
      return NextResponse.json({ error: 'Invalid recipient mode' }, { status: 400 })
    }

    recipients = [...new Set(recipients.filter(Boolean))]
    if (!recipients.length) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 })
    }

    const senderName = [session.user.firstName, session.user.lastName].filter(Boolean).join(' ') || 'Admin'
    const bodyHtml = `
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      <p class="muted" style="margin-top:24px;font-size:13px;color:#6b7280;">
        Sent by ${escapeHtml(senderName)} · ${escapeHtml(COMPANY.brandName)}<br>
        <a href="${escapeHtml(getAppUrl())}">${escapeHtml(getAppUrl())}</a>
      </p>
    `
    const html = emailLayout({
      title: subject,
      subtitle: COMPANY.brandName,
      bodyHtml,
    })

    const result = await sendEmail({
      to: recipients,
      subject,
      html,
      replyTo: session.user.email,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: typeof result.error === 'string' ? result.error : 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      message: `Email sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
