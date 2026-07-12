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
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function subscribeToEngineeringDigest(input: {
  email: string
  name?: string | null
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const email = input.email.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Enter a valid email address' }
  }

  const { error } = await supabaseAdmin.from('engineering_digest_subscribers').upsert(
    {
      email,
      name: input.name?.trim() || null,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: 'email' }
  )

  if (error?.message?.includes('engineering_digest_subscribers')) {
    return {
      success: false,
      error: 'Digest table not ready. Run scripts/47-engineering-blog.sql in Supabase.',
    }
  }
  if (error) return { success: false, error: error.message }
  return { success: true }
}

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

  const { data: subscribers, error: subError } = await supabaseAdmin
    .from('engineering_digest_subscribers')
    .select('email, name')
    .eq('status', 'active')

  if (subError?.message?.includes('engineering_digest_subscribers')) {
    return { sent: 0, articles: articles.length, skipped: 'Subscribers table missing' }
  }
  if (!subscribers?.length) return { sent: 0, articles: articles.length, skipped: 'No subscribers' }

  const normalized = articles.map((row) => ({
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
    digest_sent_at: null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }))

  const itemsHtml = normalized.map(articleDigestItem).join('')
  const appUrl = getAppUrl()
  let sent = 0

  for (const sub of subscribers) {
    const result: SendEmailResult = await sendEmail({
      to: sub.email,
      subject: `The Weekly Circuit — ${normalized.length} new field note${normalized.length === 1 ? '' : 's'}`,
      html: emailLayout({
        title: 'The Weekly Circuit',
        subtitle: `${COMPANY.brandName} Field Notes`,
        headerTone: 'primary',
        bodyHtml: `
          <p>Hi ${escapeHtml(sub.name?.trim() || 'engineer')},</p>
          <p>Here are this week&apos;s practical engineering articles from <strong>Field Notes</strong>:</p>
          ${itemsHtml}
          ${ctaButton('Browse all Field Notes', `${appUrl}/engineering`)}
          <p style="font-size:12px;color:#64748b">You subscribed to engineering field notes at ${escapeHtml(appUrl)}.</p>
        `,
      }),
    })
    if (result.success) sent += 1
  }

  const now = new Date().toISOString()
  await supabaseAdmin
    .from('engineering_articles')
    .update({ digest_sent_at: now })
    .in(
      'id',
      normalized.map((a) => a.id)
    )

  return { sent, articles: normalized.length }
}
