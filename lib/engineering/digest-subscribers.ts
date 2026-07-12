import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ENGINEERING_ARTICLE_TAGS } from '@/lib/engineering/articles'

export type DigestFrequency = 'weekly' | 'off'

export type DigestSubscriber = {
  id: string
  email: string
  name: string | null
  user_id: string | null
  preferred_tags: string[]
  frequency: DigestFrequency
  status: 'active' | 'unsubscribed'
  unsubscribe_token: string | null
  subscribed_at: string
  unsubscribed_at: string | null
}

const MISSING_TABLE =
  /relation .*engineering_digest_subscribers.* does not exist|could not find the table .*engineering_digest_subscribers/i

export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString('hex')
}

function normalizeSubscriber(row: Record<string, unknown>): DigestSubscriber {
  const tags = Array.isArray(row.preferred_tags) ? row.preferred_tags.map(String) : []
  const frequency = String(row.frequency ?? 'weekly') as DigestFrequency
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    name: row.name != null ? String(row.name) : null,
    user_id: row.user_id != null ? String(row.user_id) : null,
    preferred_tags: tags,
    frequency: frequency === 'off' ? frequency : 'weekly',
    status: row.status === 'unsubscribed' ? 'unsubscribed' : 'active',
    unsubscribe_token: row.unsubscribe_token != null ? String(row.unsubscribe_token) : null,
    subscribed_at: String(row.subscribed_at ?? new Date().toISOString()),
    unsubscribed_at: row.unsubscribed_at != null ? String(row.unsubscribed_at) : null,
  }
}

function validTags(tags: string[]): string[] {
  const allowed = new Set<string>(ENGINEERING_ARTICLE_TAGS)
  return tags.filter((t) => allowed.has(t))
}

async function ensureUnsubscribeToken(subscriberId: string, existing: string | null): Promise<string> {
  if (existing) return existing
  const token = generateUnsubscribeToken()
  if (!supabaseAdmin) return token
  await supabaseAdmin
    .from('engineering_digest_subscribers')
    .update({ unsubscribe_token: token })
    .eq('id', subscriberId)
  return token
}

export async function subscribeToEngineeringDigest(input: {
  email: string
  name?: string | null
  userId?: string | null
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const email = input.email.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Enter a valid email address' }
  }

  const { data: existing } = await supabaseAdmin
    .from('engineering_digest_subscribers')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  const token =
    existing?.unsubscribe_token != null
      ? String(existing.unsubscribe_token)
      : generateUnsubscribeToken()
  const payload: Record<string, unknown> = {
    email,
    name: input.name?.trim() || null,
    status: 'active',
    subscribed_at: new Date().toISOString(),
    unsubscribed_at: null,
    unsubscribe_token: token,
  }

  if (input.userId) {
    payload.user_id = input.userId
  }

  const { error } = await supabaseAdmin.from('engineering_digest_subscribers').upsert(payload, {
    onConflict: 'email',
  })

  if (error?.message?.includes('unsubscribe_token') || error?.message?.includes('user_id')) {
    const { error: legacyError } = await supabaseAdmin.from('engineering_digest_subscribers').upsert(
      {
        email,
        name: input.name?.trim() || null,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    )
    if (legacyError) return { success: false, error: legacyError.message }
    return { success: true }
  }
  if (error && MISSING_TABLE.test(error.message)) {
    return {
      success: false,
      error: 'Digest table not ready. Run scripts/47-engineering-blog.sql in Supabase.',
    }
  }
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getDigestSubscriber(input: {
  userId?: string | null
  token?: string | null
  email?: string | null
}): Promise<DigestSubscriber | null> {
  if (!supabaseAdmin) return null

  let query = supabaseAdmin.from('engineering_digest_subscribers').select('*')

  if (input.token) {
    query = query.eq('unsubscribe_token', input.token.trim())
  } else if (input.userId) {
    query = query.eq('user_id', input.userId)
  } else if (input.email) {
    query = query.eq('email', input.email.trim().toLowerCase())
  } else {
    return null
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    if (error.message.includes('unsubscribe_token') || error.message.includes('user_id')) {
      if (input.email) {
        const fallback = await supabaseAdmin
          .from('engineering_digest_subscribers')
          .select('*')
          .eq('email', input.email.trim().toLowerCase())
          .maybeSingle()
        if (fallback.data) return normalizeSubscriber(fallback.data as Record<string, unknown>)
      }
      return null
    }
    if (MISSING_TABLE.test(error.message)) return null
    throw error
  }
  if (data) return normalizeSubscriber(data as Record<string, unknown>)

  if (input.userId && input.email) {
    return getDigestSubscriber({ email: input.email })
  }

  return null
}

export async function updateDigestPreferences(input: {
  userId?: string | null
  token?: string | null
  email?: string | null
  preferredTags?: string[]
  frequency?: DigestFrequency
  name?: string | null
}): Promise<{ success: boolean; subscriber?: DigestSubscriber; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const subscriber = await getDigestSubscriber({
    userId: input.userId,
    token: input.token,
    email: input.email,
  })
  if (!subscriber) {
    return { success: false, error: 'Subscription not found' }
  }

  const updates: Record<string, unknown> = {}
  if (input.preferredTags !== undefined) {
    updates.preferred_tags = validTags(input.preferredTags)
  }
  if (input.frequency !== undefined) {
    updates.frequency = input.frequency
  }
  if (input.name !== undefined) {
    updates.name = input.name?.trim() || null
  }
  if (input.userId && !subscriber.user_id) {
    updates.user_id = input.userId
  }

  if (Object.keys(updates).length === 0) {
    return { success: true, subscriber }
  }

  const { data, error } = await supabaseAdmin
    .from('engineering_digest_subscribers')
    .update(updates)
    .eq('id', subscriber.id)
    .select('*')
    .single()

  if (error?.message?.includes('preferred_tags') || error?.message?.includes('frequency')) {
    return {
      success: false,
      error: 'Digest preferences require scripts/50-engineering-blog-phase4.sql.',
    }
  }
  if (error) return { success: false, error: error.message }

  const normalized = normalizeSubscriber(data as Record<string, unknown>)
  const token = await ensureUnsubscribeToken(normalized.id, normalized.unsubscribe_token)
  return { success: true, subscriber: { ...normalized, unsubscribe_token: token } }
}

export async function unsubscribeFromDigest(input: {
  userId?: string | null
  token?: string | null
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const subscriber = await getDigestSubscriber({
    userId: input.userId,
    token: input.token,
  })
  if (!subscriber) {
    return { success: false, error: 'Subscription not found' }
  }

  const { error } = await supabaseAdmin
    .from('engineering_digest_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      frequency: 'off',
    })
    .eq('id', subscriber.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function countActiveDigestSubscribers(): Promise<number> {
  if (!supabaseAdmin) return 0
  const { count, error } = await supabaseAdmin
    .from('engineering_digest_subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) {
    if (MISSING_TABLE.test(error.message)) return 0
    return 0
  }
  return count ?? 0
}
