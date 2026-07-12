import { loadPublishedArticles } from '@/lib/engineering/queries'
import { COMPANY } from '@/lib/company/constants'

export const dynamic = 'force-dynamic'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://energyandlogics.com').replace(/\/$/, '')
  const articles = await loadPublishedArticles({ limit: 40, accessLevel: 'public' })

  const items = articles
    .map((article) => {
      const link = `${baseUrl}/engineering/${article.slug}`
      const pubDate = article.published_at
        ? new Date(article.published_at).toUTCString()
        : new Date(article.created_at).toUTCString()
      const description = escapeXml(article.excerpt || article.body.slice(0, 280))
      return `
  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>
  </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(`${COMPANY.brandName} Field Notes`)}</title>
  <link>${baseUrl}/engineering</link>
  <description>${escapeXml('Practical engineering articles for electricians, PLC techs, and embedded engineers.')}</description>
  <language>en</language>${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
