import { Resend } from 'resend'
import { COMPANY } from '@/lib/company/constants'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() || `${COMPANY.brandName} <noreply@energyandlogics.com>`

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || COMPANY.email

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://energyandlogics.com'
  return url.replace(/\/$/, '')
}

export type SendEmailResult = { success: boolean; error?: unknown }

export async function sendEmail(input: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}): Promise<SendEmailResult> {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean)
  if (!recipients.length) {
    return { success: false, error: 'No recipient' }
  }

  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipped:', input.subject)
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    })
    return { success: true }
  } catch (error) {
    console.error('[email] Send failed:', input.subject, error)
    return { success: false, error }
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function emailLayout(options: {
  title: string
  subtitle?: string
  bodyHtml: string
  headerTone?: 'primary' | 'neutral' | 'success' | 'warning'
}): string {
  const headerColors = {
    primary: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
    neutral: 'linear-gradient(135deg, #666666 0%, #4a4a4a 100%)',
    success: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    warning: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
  }
  const headerBg = headerColors[options.headerTone ?? 'primary']
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; margin: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: ${headerBg}; color: white; padding: 28px 24px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9fafb; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      .button { background: #0066cc; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: 600; }
      h1 { margin: 0 0 8px 0; font-size: 22px; }
      .subtitle { margin: 0; opacity: 0.95; }
      .highlight { color: #0066cc; font-weight: 600; }
      .muted { color: #6b7280; font-size: 14px; }
      ul { padding-left: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${escapeHtml(options.title)}</h1>
        ${options.subtitle ? `<p class="subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
      </div>
      <div class="content">
        ${options.bodyHtml}
      </div>
      <div class="footer">
        <p>&copy; ${year} ${escapeHtml(COMPANY.brandName)}. All rights reserved.</p>
        <p class="muted">${escapeHtml(COMPANY.email)} · ${escapeHtml(COMPANY.phoneDisplay)}</p>
      </div>
    </div>
  </body>
</html>`
}

export function ctaButton(label: string, href: string): string {
  return `<p><a class="button" href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`
}
