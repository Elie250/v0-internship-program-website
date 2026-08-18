import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import {
  defaultCandidateMessageSubject,
  sendEmployerCandidateMessageEmail,
  type CandidateMessageLink,
  type CandidateMessageType,
} from '@/lib/recruitment/email-notifications'

const MESSAGE_SELECT =
  'id, application_id, organization_id, author_user_id, recipient_user_id, recipient_email, message_type, subject, body, resource_links, delivery_status, delivery_error, sent_at, created_at'

const MESSAGE_TYPES = new Set<CandidateMessageType>([
  'general',
  'request_documents',
  'instructions',
])

export type RecruitmentApplicationMessage = {
  id: string
  application_id: string
  organization_id: string
  author_user_id: string | null
  recipient_user_id: string
  recipient_email: string
  message_type: CandidateMessageType
  subject: string
  body: string
  resource_links: CandidateMessageLink[]
  delivery_status: string
  delivery_error: string | null
  sent_at: string | null
  created_at: string
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message ?? ''
  return (
    error?.code === '42P01' ||
    /recruitment_application_messages/i.test(message) ||
    /does not exist/i.test(message)
  )
}

function parseMessageType(value: unknown): CandidateMessageType {
  const raw = String(value ?? 'general')
  return MESSAGE_TYPES.has(raw as CandidateMessageType) ? (raw as CandidateMessageType) : 'general'
}

export function parseResourceLinks(raw: unknown): CandidateMessageLink[] {
  if (!Array.isArray(raw)) return []
  const links: CandidateMessageLink[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const url = String((item as { url?: unknown }).url ?? '').trim()
    const label = String((item as { label?: unknown }).label ?? '').trim() || url
    if (!/^https?:\/\//i.test(url) || url.length > 2000) continue
    links.push({ label: label.slice(0, 200), url })
    if (links.length >= 8) break
  }
  return links
}

function mapRow(row: Record<string, unknown>): RecruitmentApplicationMessage {
  return {
    id: String(row.id),
    application_id: String(row.application_id),
    organization_id: String(row.organization_id),
    author_user_id: row.author_user_id != null ? String(row.author_user_id) : null,
    recipient_user_id: String(row.recipient_user_id),
    recipient_email: String(row.recipient_email),
    message_type: parseMessageType(row.message_type),
    subject: String(row.subject ?? ''),
    body: String(row.body ?? ''),
    resource_links: parseResourceLinks(row.resource_links),
    delivery_status: String(row.delivery_status ?? 'pending'),
    delivery_error: row.delivery_error != null ? String(row.delivery_error) : null,
    sent_at: row.sent_at != null ? String(row.sent_at) : null,
    created_at: String(row.created_at),
  }
}

export async function listApplicationMessages(applicationId: string, organizationId: string) {
  if (!supabaseAdmin) return { messages: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_application_messages')
    .select(MESSAGE_SELECT)
    .eq('application_id', applicationId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) {
    if (isMissingTableError(error)) {
      return {
        messages: [],
        error: 'Run scripts/85-recruitment-application-messages.sql in Supabase, then try again.',
      }
    }
    return { messages: [], error: error.message }
  }
  return { messages: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) }
}

export async function listCandidateMessages(candidateUserId: string) {
  if (!supabaseAdmin) return { messages: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_application_messages')
    .select(MESSAGE_SELECT)
    .eq('recipient_user_id', candidateUserId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    if (isMissingTableError(error)) return { messages: [] }
    return { messages: [], error: error.message }
  }
  return { messages: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) }
}

export async function sendApplicationCandidateMessage(input: {
  applicationId: string
  organizationId: string
  authorUserId: string
  authorEmail?: string | null
  messageType?: unknown
  subject?: unknown
  body: string
  resourceLinks?: unknown
}): Promise<{ message?: RecruitmentApplicationMessage; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const body = input.body.trim()
  if (!body) return { error: 'Message cannot be empty' }
  if (body.length > 8000) return { error: 'Message is too long' }

  const { application, error: appError } = await getOrganizationApplication(
    input.applicationId,
    input.organizationId
  )
  if (appError) return { error: appError }
  if (!application) return { error: 'Application not found' }

  const snapshot = (application.profile_snapshot ?? {}) as Record<string, unknown>
  let candidateEmail = String(snapshot.email || '').trim()
  if (!candidateEmail) {
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', application.candidate_user_id)
      .maybeSingle()
    candidateEmail = String(userRow?.email || '').trim()
  }
  if (!candidateEmail) return { error: 'Candidate email is not available' }

  const { organization } = await getOrganizationById(input.organizationId)
  if (!organization) return { error: 'Organization not found' }

  const job = Array.isArray(application.job) ? application.job[0] : application.job
  const jobTitle = job?.title || 'this role'
  const messageType = parseMessageType(input.messageType)
  const subject =
    String(input.subject ?? '').trim().slice(0, 200) ||
    defaultCandidateMessageSubject(messageType, jobTitle, organization.name)
  const resourceLinks = parseResourceLinks(input.resourceLinks)
  const replyTo = input.authorEmail?.trim() || organization.notification_email?.trim() || null

  const { data, error } = await supabaseAdmin
    .from('recruitment_application_messages')
    .insert([
      {
        application_id: input.applicationId,
        organization_id: input.organizationId,
        author_user_id: input.authorUserId,
        recipient_user_id: application.candidate_user_id,
        recipient_email: candidateEmail,
        message_type: messageType,
        subject,
        body,
        resource_links: resourceLinks,
        channel: 'email',
        delivery_status: 'pending',
      },
    ])
    .select(MESSAGE_SELECT)
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return {
        error: 'Run scripts/85-recruitment-application-messages.sql in Supabase, then try again.',
      }
    }
    return { error: error.message }
  }

  const sent = await sendEmployerCandidateMessageEmail({
    candidateEmail,
    candidateName: String(snapshot.full_name || '') || null,
    jobTitle,
    organizationName: organization.name,
    subject,
    body,
    messageType,
    resourceLinks,
    replyTo,
  })

  const deliveryStatus = sent.success ? 'sent' : 'failed'
  const deliveryError = sent.success
    ? null
    : sent.error instanceof Error
      ? sent.error.message
      : typeof sent.error === 'string'
        ? sent.error
        : 'Email could not be sent'
  const sentAt = sent.success ? new Date().toISOString() : null

  await supabaseAdmin
    .from('recruitment_application_messages')
    .update({
      delivery_status: deliveryStatus,
      delivery_error: deliveryError,
      sent_at: sentAt,
    })
    .eq('id', data.id)

  void supabaseAdmin.from('recruitment_notification_events').insert([
    {
      organization_id: input.organizationId,
      application_id: input.applicationId,
      recipient_user_id: application.candidate_user_id,
      recipient_email: candidateEmail,
      event_type: 'employer_candidate_message',
      channel: 'email',
      status: deliveryStatus === 'sent' ? 'sent' : 'failed',
      payload: { messageId: data.id, messageType, subject },
      error_message: deliveryError,
      sent_at: sentAt,
    },
  ])

  await writeRecruitmentAudit({
    actorUserId: input.authorUserId,
    organizationId: input.organizationId,
    action: 'candidate_message_sent',
    entityType: 'recruitment_application_messages',
    entityId: data.id,
    metadata: {
      applicationId: input.applicationId,
      messageType,
      deliveryStatus,
    },
  })

  if (!sent.success) {
    return {
      error: deliveryError || 'Email could not be sent. The message was saved — check RESEND_API_KEY.',
    }
  }

  return {
    message: mapRow({
      ...(data as Record<string, unknown>),
      delivery_status: deliveryStatus,
      delivery_error: deliveryError,
      sent_at: sentAt,
    }),
  }
}
