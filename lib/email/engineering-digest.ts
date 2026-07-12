import {
  ctaButton,
  emailLayout,
  escapeHtml,
  getAppUrl,
  sendEmail,
  type SendEmailResult,
} from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import type { EngineeringArticle } from '@/lib/engineering/articles'
import {
  subscribeToEngineeringDigest,
} from '@/lib/engineering/digest-subscribers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export { subscribeToEngineeringDigest }

function articleDigestItem(article: EngineeringArticle): string {
  const url = `${getAppUrl()}/engineering/${article.slug}`
  const excerpt = escapeHtml(article.excerpt || article.body.slice(0, 180))
  return `
    <div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0">
      <h3 style="margin:0 0 6px;font-size:17px;color:#1e3a5f">
        <a href="${url}" style="color:#1e3a5f;text-decoration:none">${escapeHtml(article.title)}</a>
      </h3>
      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.55">${excerpt}…</p>
      <a href="${url}" style="font-size:13px;color:#1e3a5f;font-weight:600">Read article →</a>
    </div>
  `
}

function articleMatchesTags(article: EngineeringArticle, preferredTags: string[]): boolean {
  if (!preferredTags.length) return true
  return article.tags.some((tag) => preferredTags.includes(tag))
}

function manageDigestUrl(token: string | null): string {
  const appUrl = getAppUrl()
  if (token) return `${appUrl}/engineering/digest/manage?token=${encodeURIComponent(token)}`
  return `${appUrl}/engineering/digest/manage`
}

function unsubscribeUrl(token: string | null): string {
  const appUrl = getAppUrl()
  if (token) return `${appUrl}/api/engineering/digest/unsubscribe?token=${encodeURIComponent(token)}`
  return `${appUrl}/engineering/digest/manage`
}

/** Max digest emails per weekly cron run (protects Resend monthly quota). */
const DIGEST_MAX_RECIPIENTS_PER_RUN = 150

/** Minimum days between digest sends to the same subscriber. */
const DIGEST_MIN_DAYS_BETWEEN_SENDS = 6

type DigestSubscriberRow = {
  email: string
  name: string | null
  preferred_tags?: string[] | null
  frequency?: string | null
  unsubscribe_token?: string | null
  last_digest_sent_at?: string | null
}

export async function sendEngineeringWeeklyDigest(): Promise<{
  sent: number
  articles: number
  skipped?: string
}> {
  if (!supabaseAdmin) return { sent: 0, articles: 0, skipped: 'Database not configured' }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: articles, error: articlesError } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('status', 'published')
    .gte('published_at', weekAgo)
    .is('digest_sent_at', null)
    .order('published_at', { ascending: false })

  if (articlesError?.message?.includes('engineering_articles')) {
    return { sent: 0, articles: 0, skipped: 'Articles table missing' }
  }
  if (!articles?.length) return { sent: 0, articles: 0, skipped: 'No new articles this week' }

  const subscriberResult = await supabaseAdmin
    .from('engineering_digest_subscribers')
    .select('email, name, preferred_tags, frequency, unsubscribe_token, last_digest_sent_at')
    .eq('status', 'active')

  let subscribers = subscriberResult.data as DigestSubscriberRow[] | null
  let subError = subscriberResult.error
  if (
    subError?.message.includes('preferred_tags') ||
    subError?.message.includes('frequency') ||
    subError?.message.includes('unsubscribe_token') ||
    subError?.message.includes('last_digest_sent_at')
  ) {
    const legacyResult = await supabaseAdmin
      .from('engineering_digest_subscribers')
      .select('email, name')
      .eq('status', 'active')
    subscribers = legacyResult.data as DigestSubscriberRow[] | null
    subError = legacyResult.error
  }

  if (subError) {
    return { sent: 0, articles: articles.length, skipped: 'Subscribers table missing' }
  }
  if (!subscribers?.length) return { sent: 0, articles: articles.length, skipped: 'No subscribers' }

  const normalizedArticles: EngineeringArticle[] = articles.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: row.excerpt != null ? String(row.excerpt) : null,
    body: String(row.body ?? ''),
    cover_image_url: null,
    author_id: null,
    author_name: row.author_name != null ? String(row.author_name) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    access_tier: 'free' as const,
    status: 'published' as const,
    is_featured: false,
    series_id: null,
    series_sort_order: null,
    view_count: 0,
    published_at: row.published_at != null ? String(row.published_at) : null,
    scheduled_publish_at: null,
    digest_sent_at: null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }))

  const appUrl = getAppUrl()
  let sent = 0
  const includedArticleIds = new Set<string>()
  const sentSubscriberEmails: string[] = []
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const minGapMs = DIGEST_MIN_DAYS_BETWEEN_SENDS * 24 * 60 * 60 * 1000

  for (const sub of subscribers) {
    if (sent >= DIGEST_MAX_RECIPIENTS_PER_RUN) break

    const frequency = String(sub.frequency ?? 'weekly')
    if (frequency === 'off') continue

    const lastSent = sub.last_digest_sent_at ? new Date(sub.last_digest_sent_at).getTime() : 0
    if (lastSent && Date.now() - lastSent < minGapMs) continue

    const preferredTags = Array.isArray(sub.preferred_tags)
      ? sub.preferred_tags.map(String)
      : []
    const matched = normalizedArticles.filter((article) =>
      articleMatchesTags(article, preferredTags)
    )
    if (!matched.length) continue

    const itemsHtml = matched.map(articleDigestItem).join('')
    const token = sub.unsubscribe_token ?? null
    const manageLink = manageDigestUrl(token)
    const unsubLink = unsubscribeUrl(token)

    const result: SendEmailResult = await sendEmail({
      to: sub.email,
      subject: `The Weekly Circuit — ${matched.length} new field note${matched.length === 1 ? '' : 's'}`,
      html: emailLayout({
        title: 'The Weekly Circuit',
        subtitle: `${COMPANY.brandName} Field Notes · Weekly digest`,
        headerTone: 'primary',
        bodyHtml: `
          <p>Hi ${escapeHtml(sub.name?.trim() || 'engineer')},</p>
          <p>Here is your <strong>weekly</strong> roundup of practical engineering articles from <strong>Field Notes</strong> (not a daily email):</p>
          ${itemsHtml}
          ${ctaButton('Browse all Field Notes', `${appUrl}/engineering`)}
          <p style="font-size:12px;color:#64748b;margin-top:24px">
            You receive this at most once per week to protect your inbox and our email quota.
            <br />
            <a href="${manageLink}" style="color:#64748b">Manage digest preferences</a>
            ·
            <a href="${unsubLink}" style="color:#64748b">Unsubscribe</a>
          </p>
        `,
      }),
    })
    if (result.success) {
      sent += 1
      sentSubscriberEmails.push(sub.email)
      matched.forEach((a) => includedArticleIds.add(a.id))
    }
  }

  if (includedArticleIds.size === 0) {
    return { sent: 0, articles: normalizedArticles.length, skipped: 'No matching subscribers' }
  }

  const now = new Date().toISOString()
  await supabaseAdmin
    .from('engineering_articles')
    .update({ digest_sent_at: now })
    .in('id', [...includedArticleIds])

  if (sentSubscriberEmails.length > 0) {
    await supabaseAdmin
      .from('engineering_digest_subscribers')
      .update({ last_digest_sent_at: now })
      .in('email', sentSubscriberEmails)
  }

  return { sent, articles: includedArticleIds.size }
}
