import { Resend } from 'resend'
import { COMPANY } from '@/lib/company/constants'

const resend = new Resend(process.env.RESEND_API_KEY)
const from = process.env.EMAIL_FROM ?? 'Energy & Logics <noreply@energyandlogics.com>'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://energyandlogics.com'

function baseLayout(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px">
<h1 style="color:#1e3a5f;font-size:22px">${title}</h1>
${body}
<p style="margin-top:24px;font-size:13px;color:#64748b">${COMPANY.brandName} · ${COMPANY.email}</p>
</body></html>`
}

export async function sendEnrollmentApprovedEmail(input: {
  to: string
  studentName: string
  programTitle: string
  amountPaid?: number
  accessStartsAt?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, skipped: true }
  const accessNote = input.accessStartsAt
    ? `<p>Course access opens on <strong>${new Date(input.accessStartsAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</strong>.</p>`
    : '<p>Your course materials are available now in your student dashboard.</p>'
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Enrollment confirmed — ${input.programTitle}`,
      html: baseLayout(
        'Payment approved — you are enrolled',
        `<p>Dear ${input.studentName},</p>
<p>Your MoMo payment for <strong>${input.programTitle}</strong> has been verified${
          input.amountPaid ? ` (${input.amountPaid.toLocaleString()} RWF)` : ''
        }.</p>
${accessNote}
<p><a href="${appUrl}/student/dashboard" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Open student dashboard</a></p>`
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('[email] enrollment approved:', error)
    return { success: false, error }
  }
}

export async function sendEnrollmentRejectedEmail(input: {
  to: string
  studentName: string
  programTitle: string
  reason?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, skipped: true }
  const reasonBlock = input.reason?.trim()
    ? `<p><strong>Reason:</strong> ${input.reason.trim()}</p>`
    : ''
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Payment not verified — ${input.programTitle}`,
      html: baseLayout(
        'Enrollment payment could not be verified',
        `<p>Dear ${input.studentName},</p>
<p>We could not verify your MoMo payment for <strong>${input.programTitle}</strong>.</p>
${reasonBlock}
<p>You may resubmit your receipt from your student dashboard.</p>
<p><a href="${appUrl}/student/courses" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Browse programmes</a></p>`
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('[email] enrollment rejected:', error)
    return { success: false, error }
  }
}

export async function sendSubscriptionApprovedEmail(input: {
  to: string
  name: string
  planName: string
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, skipped: true }
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Engineering support active — ${input.planName}`,
      html: baseLayout(
        'Subscription activated',
        `<p>Dear ${input.name},</p>
<p>Your payment for <strong>${input.planName}</strong> has been approved. You can now open support tickets from the engineer portal.</p>
<p><a href="${appUrl}/engineer/dashboard" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Open engineer dashboard</a></p>`
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('[email] subscription approved:', error)
    return { success: false, error }
  }
}

export async function sendSubscriptionRejectedEmail(input: {
  to: string
  name: string
  planName: string
  reason?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, skipped: true }
  const reasonBlock = input.reason?.trim()
    ? `<p><strong>Reason:</strong> ${input.reason.trim()}</p>`
    : ''
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Subscription payment not verified — ${input.planName}`,
      html: baseLayout(
        'Subscription payment could not be verified',
        `<p>Dear ${input.name},</p>
<p>We could not verify your MoMo payment for <strong>${input.planName}</strong>.</p>
${reasonBlock}
<p><a href="${appUrl}/engineering-support" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Try again</a></p>`
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('[email] subscription rejected:', error)
    return { success: false, error }
  }
}

export async function sendCertificateIssuedEmail(input: {
  to: string
  studentName: string
  programTitle: string
  certificateCode: string
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, skipped: true }
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Certificate issued — ${input.programTitle}`,
      html: baseLayout(
        'Congratulations — your certificate is ready',
        `<p>Dear ${input.studentName},</p>
<p>You have successfully completed <strong>${input.programTitle}</strong>.</p>
<p>Certificate ID: <strong>${input.certificateCode}</strong></p>
<p><a href="${appUrl}/student/certificates" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">View certificate</a></p>`
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('[email] certificate issued:', error)
    return { success: false, error }
  }
}
