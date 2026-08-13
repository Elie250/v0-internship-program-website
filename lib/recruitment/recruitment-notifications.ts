/**
 * Recruitment notification events + email delivery.
 * Stores events for auditability; skips spammy duplicates lightly.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  sendApplicationStatusChangedEmail,
  sendApplicationSubmittedEmail,
} from '@/lib/recruitment/email-notifications'
import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import { getRecruitmentPublicUrl } from '@/lib/recruitment/passwordless-auth'
import type { RecruitmentApplicationStatus } from '@/lib/recruitment/types'

async function recordNotificationEvent(input: {
  organizationId?: string | null
  applicationId?: string | null
  interviewId?: string | null
  recipientUserId?: string | null
  recipientEmail?: string | null
  eventType: string
  channel?: 'email' | 'in_app' | 'both'
  payload?: Record<string, unknown>
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  errorMessage?: string | null
}) {
  if (!supabaseAdmin) return
  await supabaseAdmin.from('recruitment_notification_events').insert([
    {
      organization_id: input.organizationId ?? null,
      application_id: input.applicationId ?? null,
      interview_id: input.interviewId ?? null,
      recipient_user_id: input.recipientUserId ?? null,
      recipient_email: input.recipientEmail ?? null,
      event_type: input.eventType,
      channel: input.channel ?? 'email',
      status: input.status,
      payload: input.payload ?? {},
      error_message: input.errorMessage ?? null,
      sent_at: input.status === 'sent' ? new Date().toISOString() : null,
    },
  ])
}

export async function notifyApplicationStatusChanged(input: {
  organizationId: string
  applicationId: string
  candidateUserId: string
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  status: RecruitmentApplicationStatus
}) {
  // Skip noisy intermediate spam: still notify meaningful status changes
  const notifyStatuses = new Set([
    'under_review',
    'screening',
    'shortlisted',
    'interview',
    'offer',
    'hired',
    'rejected',
  ])
  if (!notifyStatuses.has(input.status)) {
    await recordNotificationEvent({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      recipientUserId: input.candidateUserId,
      recipientEmail: input.candidateEmail,
      eventType: 'application_status_changed',
      status: 'skipped',
      payload: { status: input.status, reason: 'non_notifiable_status' },
    })
    return
  }

  try {
    await sendApplicationStatusChangedEmail({
      candidateEmail: input.candidateEmail,
      candidateName: input.candidateName,
      jobTitle: input.jobTitle,
      organizationName: input.organizationName,
      status: input.status,
      applicationId: input.applicationId,
    })
    await recordNotificationEvent({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      recipientUserId: input.candidateUserId,
      recipientEmail: input.candidateEmail,
      eventType: 'application_status_changed',
      status: 'sent',
      payload: { status: input.status },
    })
  } catch (error) {
    await recordNotificationEvent({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      recipientUserId: input.candidateUserId,
      recipientEmail: input.candidateEmail,
      eventType: 'application_status_changed',
      status: 'failed',
      payload: { status: input.status },
      errorMessage: error instanceof Error ? error.message : 'send failed',
    })
  }
}

export async function notifyInterviewEvent(input: {
  organizationId: string
  applicationId: string
  interviewId: string
  candidateUserId: string
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  eventType: 'interview_invitation' | 'interview_rescheduled' | 'interview_cancelled'
  scheduledAt: string
  interviewType: string
  location?: string | null
  meetingUrl?: string | null
  candidateInstructions?: string | null
}) {
  const name = input.candidateName?.trim() || 'there'
  const dashboardUrl = `${getRecruitmentPublicUrl()}/app`
  const when = new Date(input.scheduledAt).toLocaleString()
  const titles = {
    interview_invitation: 'You are invited to an interview',
    interview_rescheduled: 'Your interview has been rescheduled',
    interview_cancelled: 'Your interview has been cancelled',
  }
  const subjects = {
    interview_invitation: `Interview invitation — ${input.jobTitle} at ${input.organizationName}`,
    interview_rescheduled: `Interview rescheduled — ${input.jobTitle}`,
    interview_cancelled: `Interview cancelled — ${input.jobTitle}`,
  }

  try {
    await sendEmail({
      to: input.candidateEmail,
      subject: subjects[input.eventType],
      html: emailLayout({
        title: titles[input.eventType],
        subtitle: `${COMPANY.brandName} Talent · ${escapeHtml(input.organizationName)}`,
        headerTone: input.eventType === 'interview_cancelled' ? 'warning' : 'primary',
        bodyHtml: `
          <p>Dear ${escapeHtml(name)},</p>
          <p>Regarding your application for <strong>${escapeHtml(input.jobTitle)}</strong> at <strong>${escapeHtml(input.organizationName)}</strong>.</p>
          <p><strong>When:</strong> ${escapeHtml(when)}</p>
          <p><strong>Format:</strong> ${escapeHtml(input.interviewType.replace('_', ' '))}</p>
          ${input.location ? `<p><strong>Location:</strong> ${escapeHtml(input.location)}</p>` : ''}
          ${input.meetingUrl ? `<p><strong>Meeting link:</strong> <a href="${escapeHtml(input.meetingUrl)}">${escapeHtml(input.meetingUrl)}</a></p>` : ''}
          ${
            input.candidateInstructions
              ? `<p><strong>Notes from the hiring team:</strong> ${escapeHtml(input.candidateInstructions)}</p>`
              : ''
          }
          <p style="margin:28px 0 12px"><a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">View your applications</a></p>
          <p style="font-size:12px;color:#94a3b8;margin-top:24px">
            This message was sent by ${escapeHtml(COMPANY.brandName)} Talent on behalf of ${escapeHtml(input.organizationName)}.
          </p>
        `,
      }),
    })
    await recordNotificationEvent({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      interviewId: input.interviewId,
      recipientUserId: input.candidateUserId,
      recipientEmail: input.candidateEmail,
      eventType: input.eventType,
      status: 'sent',
      payload: { scheduledAt: input.scheduledAt, interviewType: input.interviewType },
    })
  } catch (error) {
    await recordNotificationEvent({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      interviewId: input.interviewId,
      recipientUserId: input.candidateUserId,
      recipientEmail: input.candidateEmail,
      eventType: input.eventType,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'send failed',
    })
  }
}

export { sendApplicationSubmittedEmail }
