/**
 * Organization webhooks — signed deliveries, idempotent event IDs, retry design.
 */

import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'

export const WEBHOOK_EVENT_TYPES = [
  'application.created',
  'application.status_changed',
  'screening.completed',
  'interview.created',
  'interview.updated',
  'interview.completed',
  'candidate.hired',
] as const

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number]

export function isWebhookEventType(value: string): value is WebhookEventType {
  return (WEBHOOK_EVENT_TYPES as readonly string[]).includes(value)
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`
}

export function signWebhookPayload(secret: string, timestamp: string, body: string): string {
  const base = `${timestamp}.${body}`
  return crypto.createHmac('sha256', secret).update(base).digest('hex')
}

export function verifyWebhookSignature(input: {
  secret: string
  timestamp: string
  body: string
  signatureHeader: string
  toleranceSec?: number
}): boolean {
  const tolerance = input.toleranceSec ?? 300
  const ts = Number(input.timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Date.now() / 1000 - ts) > tolerance) return false

  const expected = signWebhookPayload(input.secret, input.timestamp, input.body)
  const provided = input.signatureHeader.replace(/^sha256=/i, '').trim()
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Retry backoff minutes: 1, 5, 30, 120, then abandon */
export function nextRetryAt(attemptCount: number, from = new Date()): Date | null {
  const delaysMin = [1, 5, 30, 120]
  if (attemptCount >= delaysMin.length + 1) return null
  const minutes = delaysMin[Math.min(attemptCount - 1, delaysMin.length - 1)] ?? 120
  return new Date(from.getTime() + minutes * 60_000)
}

export function createEventId(eventType: string, resourceId: string, version = 1): string {
  return `evt_${eventType.replace(/\./g, '_')}_${resourceId}_${version}`
}

function sanitizeWebhook(row: {
  id: string
  organization_id: string
  name: string
  target_url: string
  events: unknown
  status: string
  last_delivery_at: string | null
  created_at: string
  updated_at: string
}) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    targetUrl: row.target_url,
    events: Array.isArray(row.events) ? row.events : [],
    status: row.status,
    lastDeliveryAt: row.last_delivery_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // signing_secret never returned
  }
}

export async function listWebhooks(organizationId: string) {
  if (!supabaseAdmin) return { webhooks: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_webhooks')
    .select(
      'id, organization_id, name, target_url, events, status, last_delivery_at, created_at, updated_at'
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) return { webhooks: [], error: error.message }
  return { webhooks: (data ?? []).map(sanitizeWebhook) }
}

export async function createWebhook(input: {
  organizationId: string
  name: string
  targetUrl: string
  events: unknown
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const name = input.name.trim()
  const targetUrl = input.targetUrl.trim()
  if (!name) return { error: 'Name is required' }
  if (!/^https:\/\//i.test(targetUrl)) {
    return { error: 'Webhook URL must use HTTPS' }
  }
  const events = Array.isArray(input.events)
    ? input.events.map(String).filter(isWebhookEventType)
    : []
  if (events.length === 0) return { error: 'At least one event type is required' }

  const signingSecret = generateWebhookSecret()
  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('recruitment_webhooks')
    .insert([
      {
        organization_id: input.organizationId,
        name,
        target_url: targetUrl,
        signing_secret: signingSecret,
        events,
        status: 'active',
        created_by: input.actorUserId,
        created_at: now,
        updated_at: now,
      },
    ])
    .select(
      'id, organization_id, name, target_url, events, status, last_delivery_at, created_at, updated_at'
    )
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'webhook_created',
    entityType: 'recruitment_webhooks',
    entityId: data.id,
    metadata: { events, targetUrl },
  })

  return {
    webhook: sanitizeWebhook(data),
    signingSecret, // once
  }
}

export async function rotateWebhookSecret(input: {
  organizationId: string
  webhookId: string
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const signingSecret = generateWebhookSecret()
  const { data, error } = await supabaseAdmin
    .from('recruitment_webhooks')
    .update({
      signing_secret: signingSecret,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.webhookId)
    .eq('organization_id', input.organizationId)
    .select(
      'id, organization_id, name, target_url, events, status, last_delivery_at, created_at, updated_at'
    )
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'Webhook not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'webhook_secret_rotated',
    entityType: 'recruitment_webhooks',
    entityId: input.webhookId,
    metadata: {},
  })

  return { webhook: sanitizeWebhook(data), signingSecret }
}

export async function setWebhookStatus(input: {
  organizationId: string
  webhookId: string
  status: 'active' | 'inactive' | 'revoked'
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_webhooks')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.webhookId)
    .eq('organization_id', input.organizationId)
    .select(
      'id, organization_id, name, target_url, events, status, last_delivery_at, created_at, updated_at'
    )
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'Webhook not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'webhook_status_changed',
    entityType: 'recruitment_webhooks',
    entityId: input.webhookId,
    metadata: { status: input.status },
  })

  return { webhook: sanitizeWebhook(data) }
}

/**
 * Enqueue idempotent webhook deliveries for an org event.
 * Does not perform HTTP delivery inline (caller / worker may process pending).
 */
export async function enqueueWebhookEvent(input: {
  organizationId: string
  eventType: WebhookEventType
  eventId: string
  data: Record<string, unknown>
}) {
  if (!supabaseAdmin) return { deliveries: [], error: 'Database not configured' }
  const { data: hooks } = await supabaseAdmin
    .from('recruitment_webhooks')
    .select('id, events, status')
    .eq('organization_id', input.organizationId)
    .eq('status', 'active')

  const deliveries: string[] = []
  for (const hook of hooks ?? []) {
    const events = Array.isArray(hook.events) ? hook.events.map(String) : []
    if (!events.includes(input.eventType)) continue

    const payload = {
      id: input.eventId,
      type: input.eventType,
      created_at: new Date().toISOString(),
      data: input.data,
    }

    const { data, error } = await supabaseAdmin
      .from('recruitment_webhook_deliveries')
      .upsert(
        [
          {
            organization_id: input.organizationId,
            webhook_id: hook.id,
            event_id: input.eventId,
            event_type: input.eventType,
            payload,
            status: 'pending',
            attempt_count: 0,
            next_attempt_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'webhook_id,event_id', ignoreDuplicates: true }
      )
      .select('id')

    if (!error && data?.[0]?.id) deliveries.push(data[0].id)
  }

  return { deliveries }
}

/** Attempt one pending delivery (used by worker or sync process). */
export async function attemptWebhookDelivery(deliveryId: string) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data: delivery } = await supabaseAdmin
    .from('recruitment_webhook_deliveries')
    .select(
      'id, organization_id, webhook_id, event_id, event_type, payload, status, attempt_count'
    )
    .eq('id', deliveryId)
    .maybeSingle()
  if (!delivery) return { error: 'Delivery not found' }
  if (delivery.status === 'delivered') return { skipped: true, reason: 'already_delivered' }

  const { data: webhook } = await supabaseAdmin
    .from('recruitment_webhooks')
    .select('id, target_url, signing_secret, status')
    .eq('id', delivery.webhook_id)
    .maybeSingle()
  if (!webhook || webhook.status !== 'active') {
    return { error: 'Webhook inactive' }
  }

  const body = JSON.stringify(delivery.payload)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = signWebhookPayload(webhook.signing_secret, timestamp, body)
  const attempt = Number(delivery.attempt_count) + 1

  try {
    const res = await fetch(webhook.target_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EnergyAndLogics-Recruitment-Webhooks/1.0',
        'X-EL-Webhook-Id': delivery.event_id,
        'X-EL-Webhook-Timestamp': timestamp,
        'X-EL-Webhook-Signature': `sha256=${signature}`,
      },
      body,
    })

    if (res.ok) {
      await supabaseAdmin
        .from('recruitment_webhook_deliveries')
        .update({
          status: 'delivered',
          attempt_count: attempt,
          last_http_status: res.status,
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', deliveryId)
      await supabaseAdmin
        .from('recruitment_webhooks')
        .update({ last_delivery_at: new Date().toISOString() })
        .eq('id', webhook.id)
      return { delivered: true, status: res.status }
    }

    const retryAt = nextRetryAt(attempt)
    await supabaseAdmin
      .from('recruitment_webhook_deliveries')
      .update({
        status: retryAt ? 'pending' : 'abandoned',
        attempt_count: attempt,
        last_http_status: res.status,
        last_error: `HTTP ${res.status}`,
        next_attempt_at: retryAt?.toISOString() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
    return { delivered: false, status: res.status }
  } catch (err) {
    const retryAt = nextRetryAt(attempt)
    await supabaseAdmin
      .from('recruitment_webhook_deliveries')
      .update({
        status: retryAt ? 'pending' : 'abandoned',
        attempt_count: attempt,
        last_error: err instanceof Error ? err.message : 'delivery failed',
        next_attempt_at: retryAt?.toISOString() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
    return { delivered: false, error: 'network_error' }
  }
}
