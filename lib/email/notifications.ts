import {
  ADMIN_NOTIFICATION_EMAIL,
  ctaButton,
  emailLayout,
  escapeHtml,
  getAppUrl,
  sendEmail,
  type SendEmailResult,
} from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'

export type ApplicationEmailParams = {
  to: string
  full_name: string
  program: string
  status: 'accepted' | 'declined'
}

export async function sendApplicationEmail(params: ApplicationEmailParams): Promise<SendEmailResult> {
  const name = escapeHtml(params.full_name)
  const program = escapeHtml(params.program)

  if (params.status === 'accepted') {
    return sendEmail({
      to: params.to,
      subject: 'Congratulations! Your Application Has Been Accepted',
      html: emailLayout({
        title: `Congratulations, ${params.full_name}!`,
        subtitle: 'Your application has been accepted',
        headerTone: 'success',
        bodyHtml: `
          <p>Dear ${name},</p>
          <p>Your application for the <span class="highlight">${program}</span> program has been <strong>accepted</strong>.</p>
          <h3>Next steps</h3>
          <ul>
            <li>Complete payment if required for your programme</li>
            <li>Review the schedule and requirements on our website</li>
            <li>Contact us if you have any questions</li>
          </ul>
          ${ctaButton('Visit Engineering Hub', getAppUrl())}
          <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
        `,
      }),
    })
  }

  return sendEmail({
    to: params.to,
    subject: 'Application Status Update',
    html: emailLayout({
      title: 'Application Status Update',
      subtitle: `${params.program} programme`,
      headerTone: 'neutral',
      bodyHtml: `
        <p>Dear ${name},</p>
        <p>Thank you for applying to the <span class="highlight">${program}</span> programme.</p>
        <p>After careful review, your application was not selected at this time. We encourage you to strengthen your profile and apply again in the future.</p>
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendPaymentSubmittedToAdmin(input: {
  payerName: string
  payerEmail: string
  amount: number
  context: string
  receiptNumber?: string | null
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New payment receipt — ${input.payerName}`,
    replyTo: input.payerEmail,
    html: emailLayout({
      title: 'New payment receipt',
      subtitle: 'Awaiting admin review',
      headerTone: 'warning',
      bodyHtml: `
        <p>A new MoMo payment receipt was submitted and needs review.</p>
        <ul>
          <li><strong>Payer:</strong> ${escapeHtml(input.payerName)}</li>
          <li><strong>Email:</strong> ${escapeHtml(input.payerEmail)}</li>
          <li><strong>Amount:</strong> ${input.amount.toLocaleString()} RWF</li>
          <li><strong>For:</strong> ${escapeHtml(input.context)}</li>
          ${input.receiptNumber ? `<li><strong>Receipt #:</strong> ${escapeHtml(input.receiptNumber)}</li>` : ''}
        </ul>
        ${ctaButton('Review in admin dashboard', `${appUrl}/admin/dashboard/payments`)}
      `,
    }),
  })
}

export async function sendPaymentApprovedEmail(input: {
  to: string
  payerName: string
  amount: number
  context: string
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  return sendEmail({
    to: input.to,
    subject: 'Payment approved — access activated',
    html: emailLayout({
      title: 'Payment approved',
      subtitle: 'Your receipt was verified',
      headerTone: 'success',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.payerName)},</p>
        <p>We verified your payment of <strong>${input.amount.toLocaleString()} RWF</strong> for <span class="highlight">${escapeHtml(input.context)}</span>.</p>
        <p>Your access is now active. Sign in to your dashboard to get started.</p>
        ${ctaButton('Go to dashboard', appUrl)}
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendPaymentRejectedEmail(input: {
  to: string
  payerName: string
  amount: number
  context: string
  adminNotes?: string | null
}): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: 'Payment could not be verified',
    html: emailLayout({
      title: 'Payment not approved',
      subtitle: input.context,
      headerTone: 'warning',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.payerName)},</p>
        <p>We could not verify your payment of <strong>${input.amount.toLocaleString()} RWF</strong> for ${escapeHtml(input.context)}.</p>
        ${input.adminNotes ? `<p><strong>Note from our team:</strong> ${escapeHtml(input.adminNotes)}</p>` : ''}
        <p>Please check your receipt details and resubmit, or contact us at ${escapeHtml(COMPANY.email)}.</p>
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendPaymentRefundedEmail(input: {
  to: string
  payerName: string
  context: string
  adminNotes?: string | null
}): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: 'Payment refunded — access revoked',
    html: emailLayout({
      title: 'Payment refunded',
      subtitle: input.context,
      headerTone: 'neutral',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.payerName)},</p>
        <p>Your payment for <span class="highlight">${escapeHtml(input.context)}</span> has been refunded and related access has been revoked.</p>
        ${input.adminNotes ? `<p><strong>Note:</strong> ${escapeHtml(input.adminNotes)}</p>` : ''}
        <p>If you have questions, contact us at ${escapeHtml(COMPANY.email)}.</p>
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendEnrollmentAdmittedEmail(input: {
  to: string
  studentName: string
  courseTitle: string
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  return sendEmail({
    to: input.to,
    subject: `Enrolled — ${input.courseTitle}`,
    html: emailLayout({
      title: 'You are enrolled!',
      subtitle: input.courseTitle,
      headerTone: 'success',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.studentName)},</p>
        <p>You now have access to <span class="highlight">${escapeHtml(input.courseTitle)}</span> on ${escapeHtml(COMPANY.platformName)}.</p>
        ${ctaButton('Open student dashboard', `${appUrl}/student/courses`)}
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendEnrollmentRejectedEmail(input: {
  to: string
  studentName: string
  courseTitle: string
  adminNotes?: string | null
}): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: `Enrollment update — ${input.courseTitle}`,
    html: emailLayout({
      title: 'Enrollment not confirmed',
      subtitle: input.courseTitle,
      headerTone: 'warning',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.studentName)},</p>
        <p>We could not confirm your enrollment in <span class="highlight">${escapeHtml(input.courseTitle)}</span> because your payment was not approved.</p>
        ${input.adminNotes ? `<p><strong>Note:</strong> ${escapeHtml(input.adminNotes)}</p>` : ''}
        <p>Contact ${escapeHtml(COMPANY.email)} if you need help resubmitting your receipt.</p>
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendStaffRegistrationPendingToAdmin(input: {
  fullName: string
  email: string
  role: string
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New ${input.role} account pending approval`,
    replyTo: input.email,
    html: emailLayout({
      title: 'Staff registration pending',
      subtitle: `${input.role} account`,
      headerTone: 'warning',
      bodyHtml: `
        <p>A new staff account is waiting for admin approval.</p>
        <ul>
          <li><strong>Name:</strong> ${escapeHtml(input.fullName)}</li>
          <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
          <li><strong>Role:</strong> ${escapeHtml(input.role)}</li>
        </ul>
        ${ctaButton('Review users', `${appUrl}/admin/dashboard/users`)}
      `,
    }),
  })
}

export async function sendStaffApprovedEmail(input: {
  to: string
  fullName: string
  role: string
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  const dashboard =
    input.role === 'lecturer' || input.role === 'instructor'
      ? `${appUrl}/lecturer/dashboard`
      : input.role === 'engineer'
        ? `${appUrl}/engineer/dashboard`
        : appUrl

  return sendEmail({
    to: input.to,
    subject: 'Your account has been approved',
    html: emailLayout({
      title: 'Account approved',
      subtitle: `Welcome to ${COMPANY.platformName}`,
      headerTone: 'success',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.fullName)},</p>
        <p>Your <span class="highlight">${escapeHtml(input.role)}</span> account has been approved. You can now sign in and access your dashboard.</p>
        ${ctaButton('Sign in', `${appUrl}/auth/login`)}
        <p class="muted">Dashboard: <a href="${escapeHtml(dashboard)}">${escapeHtml(dashboard)}</a></p>
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendSupportTicketCreatedToAdmin(input: {
  title: string
  requesterName: string
  requesterEmail: string
  priority: string
  description: string
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  const preview =
    input.description.length > 400
      ? `${input.description.slice(0, 400)}…`
      : input.description

  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Support ticket — ${input.title}`,
    replyTo: input.requesterEmail,
    html: emailLayout({
      title: 'New support request',
      subtitle: input.title,
      headerTone: 'warning',
      bodyHtml: `
        <ul>
          <li><strong>From:</strong> ${escapeHtml(input.requesterName)} (${escapeHtml(input.requesterEmail)})</li>
          <li><strong>Priority:</strong> ${escapeHtml(input.priority)}</li>
        </ul>
        <p>${escapeHtml(preview)}</p>
        ${ctaButton('View tickets', `${appUrl}/admin/dashboard/support-tickets`)}
      `,
    }),
  })
}

export async function sendSupportTicketResponseEmail(input: {
  to: string
  requesterName: string
  ticketTitle: string
  adminResponse: string
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  return sendEmail({
    to: input.to,
    subject: `Reply to your support request — ${input.ticketTitle}`,
    html: emailLayout({
      title: 'Support team reply',
      subtitle: input.ticketTitle,
      headerTone: 'primary',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.requesterName)},</p>
        <p>Our team responded to your support request:</p>
        <p style="background:#fff;border-left:4px solid #0066cc;padding:12px 16px;">${escapeHtml(input.adminResponse)}</p>
        ${ctaButton('View your tickets', `${appUrl}/engineer/support`)}
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendSupportSubscriptionActivatedEmail(input: {
  to: string
  userName: string
  planName: string
  endsAt?: string | null
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl()
  const expiry = input.endsAt
    ? `<p>Your plan is active until <strong>${escapeHtml(new Date(input.endsAt).toLocaleDateString())}</strong>.</p>`
    : ''

  return sendEmail({
    to: input.to,
    subject: `Support plan active — ${input.planName}`,
    html: emailLayout({
      title: 'Support plan activated',
      subtitle: input.planName,
      headerTone: 'success',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.userName)},</p>
        <p>Your <span class="highlight">${escapeHtml(input.planName)}</span> engineering support plan is now active.</p>
        ${expiry}
        <p>You can submit help requests and use community features from your dashboard.</p>
        ${ctaButton('Open support portal', `${appUrl}/engineer/support`)}
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}

export async function sendSupportSubscriptionRejectedEmail(input: {
  to: string
  userName: string
  planName: string
  adminNotes?: string | null
}): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: `Support subscription not activated — ${input.planName}`,
    html: emailLayout({
      title: 'Subscription not activated',
      subtitle: input.planName,
      headerTone: 'warning',
      bodyHtml: `
        <p>Dear ${escapeHtml(input.userName)},</p>
        <p>We could not verify your payment for the <span class="highlight">${escapeHtml(input.planName)}</span> support plan.</p>
        ${input.adminNotes ? `<p><strong>Note:</strong> ${escapeHtml(input.adminNotes)}</p>` : ''}
        <p>Contact ${escapeHtml(COMPANY.email)} to resubmit your receipt.</p>
        <p><strong>${escapeHtml(COMPANY.brandName)} Team</strong></p>
      `,
    }),
  })
}
