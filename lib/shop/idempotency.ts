import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type IdempotencyRecord = {
  responseStatus: number
  responseBody: unknown
}

/**
 * Begin or reuse an idempotent commerce operation.
 * Returns a cached response when the same key already completed.
 */
export async function beginIdempotentRequest(input: {
  scope: string
  idempotencyKey: string
  actorUserId?: string | null
  requestFingerprint?: string | null
}): Promise<
  | { kind: 'replay'; record: IdempotencyRecord }
  | { kind: 'conflict'; error: string }
  | { kind: 'proceed' }
  | { kind: 'error'; error: string }
> {
  if (!supabaseAdmin) return { kind: 'error', error: 'Database not configured' }

  const { data: existing } = await supabaseAdmin
    .from('commerce_idempotency_keys')
    .select('status, response_status, response_body, request_fingerprint, error_message')
    .eq('scope', input.scope)
    .eq('idempotency_key', input.idempotencyKey)
    .maybeSingle()

  if (existing) {
    if (
      input.requestFingerprint &&
      existing.request_fingerprint &&
      existing.request_fingerprint !== input.requestFingerprint
    ) {
      return {
        kind: 'conflict',
        error: 'Idempotency key reused with a different request payload',
      }
    }
    if (existing.status === 'completed' && existing.response_status != null) {
      return {
        kind: 'replay',
        record: {
          responseStatus: Number(existing.response_status),
          responseBody: existing.response_body,
        },
      }
    }
    if (existing.status === 'processing') {
      return {
        kind: 'conflict',
        error: 'A request with this idempotency key is already in progress',
      }
    }
    if (existing.status === 'failed') {
      // Allow retry with same key after a failed attempt
      await supabaseAdmin
        .from('commerce_idempotency_keys')
        .update({
          status: 'processing',
          error_message: null,
          response_status: null,
          response_body: null,
          updated_at: new Date().toISOString(),
        })
        .eq('scope', input.scope)
        .eq('idempotency_key', input.idempotencyKey)
      return { kind: 'proceed' }
    }
  }

  const { error } = await supabaseAdmin.from('commerce_idempotency_keys').insert([
    {
      scope: input.scope,
      idempotency_key: input.idempotencyKey,
      actor_user_id: input.actorUserId ?? null,
      request_fingerprint: input.requestFingerprint ?? null,
      status: 'processing',
    },
  ])

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return beginIdempotentRequest(input)
    }
    return { kind: 'error', error: error.message }
  }

  return { kind: 'proceed' }
}

export async function completeIdempotentRequest(input: {
  scope: string
  idempotencyKey: string
  responseStatus: number
  responseBody: unknown
}): Promise<void> {
  if (!supabaseAdmin) return
  await supabaseAdmin
    .from('commerce_idempotency_keys')
    .update({
      status: 'completed',
      response_status: input.responseStatus,
      response_body: input.responseBody as object,
      updated_at: new Date().toISOString(),
    })
    .eq('scope', input.scope)
    .eq('idempotency_key', input.idempotencyKey)
}

export async function failIdempotentRequest(input: {
  scope: string
  idempotencyKey: string
  errorMessage: string
}): Promise<void> {
  if (!supabaseAdmin) return
  await supabaseAdmin
    .from('commerce_idempotency_keys')
    .update({
      status: 'failed',
      error_message: input.errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('scope', input.scope)
    .eq('idempotency_key', input.idempotencyKey)
}

export function fingerprintRequest(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export function createIdempotencyKey(): string {
  return randomBytes(16).toString('hex')
}
