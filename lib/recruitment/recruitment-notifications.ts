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
import {
  formatInterviewDuration,
  formatInterviewTypeLabel,
  formatInterviewWhen,
  interviewCandidateGreeting,
} from '@/lib/recruitment/interview-format'

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

function interviewDetailRow(label: string, valueHtml: string | null | undefined) {
  if (!valueHtml) return ''
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#0f172a">${valueHtml}</td>
  </tr>`
}

function interviewMeetingLinkHtml(meetingUrl?: string | null) {
  const url = meetingUrl?.trim()
  if (!url) return null
  const safe = escapeHtml(url)
  if (/^https?:\/\//i.test(url)) {
    return `<a href="${safe}">${safe}</a>`
  }
  return safe
}

function interviewWhereToJoinHtml(location?: string | null, meetingUrl?: string | null) {
  const link = interviewMeetingLinkHtml(meetingUrl)
  const place = location?.trim() ? escapeHtml(location.trim()) : null
  const parts = [link, place].filter(Boolean)
  return parts.length ? parts.join('<br>') : null
}

function interviewBringHtml(candidateInstructions?: string | null) {
  const notes = candidateInstructions?.trim()
  if (!notes) return ''
  return `
    <p style="margin:20px 0 8px"><strong>Please bring / have ready</strong></p>
    <p style="white-space:pre-wrap;margin:0">${escapeHtml(notes)}</p>
  `
}

function interviewDetailsTableHtml(input: {
  scheduledAt: string
  timezone?: string | null
  durationMinutes?: number | null
  interviewType: string
  location?: string | null
  meetingUrl?: string | null
}) {
  const duration = formatInterviewDuration(input.durationMinutes)
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px">
    ${interviewDetailRow('Date and time', escapeHtml(formatInterviewWhen(input.scheduledAt, input.timezone)))}
    ${interviewDetailRow('Duration', duration ? escapeHtml(duration) : null)}
    ${interviewDetailRow('Format', escapeHtml(formatInterviewTypeLabel(input.interviewType)))}
    ${interviewDetailRow('Where to join', interviewWhereToJoinHtml(input.location, input.meetingUrl))}
  </table>`
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
  durationMinutes?: number | null
  timezone?: string | null
  location?: string | null
  meetingUrl?: string | null
  candidateInstructions?: string | null
}) {
  const greeting = escapeHtml(interviewCandidateGreeting(input.candidateName))
  const dashboardUrl = `${getRecruitmentPublicUrl()}/app`
  const job = escapeHtml(input.jobTitle)
  const org = escapeHtml(input.organizationName)
  const when = escapeHtml(formatInterviewWhen(input.scheduledAt, input.timezone))
  const details = interviewDetailsTableHtml(input)
  const bring = interviewBringHtml(input.candidateInstructions)
  const signOff = `
    <p>Kind regards,<br>
    <strong>${org} hiring team</strong><br>
    via ${escapeHtml(COMPANY.brandName)} Talent</p>
  `
  const cta = `<p style="margin:28px 0 12px"><a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">View your applications</a></p>`

  const bodies = {
    interview_invitation: `
      <p>${greeting}</p>
      <p>Thank you for applying for <strong>${job}</strong> at <strong>${org}</strong>. We would like to invite you to an interview.</p>
      <p style="margin:20px 0 8px"><strong>Interview details</strong></p>
      ${details}
      ${bring}
      <p>If this time does not work, reply to this email and we will try to reschedule.</p>
      ${cta}
      <p>We look forward to speaking with you.</p>
      ${signOff}
    `,
    interview_rescheduled: `
      <p>${greeting}</p>
      <p>Your interview for <strong>${job}</strong> at <strong>${org}</strong> has been rescheduled. Please see the updated details below.</p>
      <p style="margin:20px 0 8px"><strong>Updated interview details</strong></p>
      ${details}
      ${bring}
      <p>If this time does not work, reply to this email and we will try to reschedule.</p>
      ${cta}
      ${signOff}
    `,
    interview_cancelled: `
      <p>${greeting}</p>
      <p>Your interview for <strong>${job}</strong> at <strong>${org}</strong>, scheduled for <strong>${when}</strong>, has been cancelled.</p>
      <p>If you have questions, reply to this email.</p>
      ${cta}
      ${signOff}
    `,
  }
  const titles = {
    interview_invitation: 'You are invited to an interview',
    interview_rescheduled: 'Your interview has been rescheduled',
    interview_cancelled: 'Your interview has been cancelled',
  }
  const subjects = {
    interview_invitation: `Interview invitation — ${input.jobTitle} at ${input.organizationName}`,
    interview_rescheduled: `Interview rescheduled — ${input.jobTitle} at ${input.organizationName}`,
    interview_cancelled: `Interview cancelled — ${input.jobTitle} at ${input.organizationName}`,
  }

  try {
    await sendEmail({
      to: input.candidateEmail,
      subject: subjects[input.eventType],
      html: emailLayout({
        title: titles[input.eventType],
        subtitle: `${COMPANY.brandName} Talent · ${escapeHtml(input.organizationName)}`,
        headerTone: input.eventType === 'interview_cancelled' ? 'warning' : 'primary',
        bodyHtml: bodies[input.eventType],
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
      payload: {
        scheduledAt: input.scheduledAt,
        interviewType: input.interviewType,
        durationMinutes: input.durationMinutes ?? null,
        timezone: input.timezone ?? null,
      },
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
