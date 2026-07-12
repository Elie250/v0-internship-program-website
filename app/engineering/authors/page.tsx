import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { listPublishedAuthors } from '@/lib/engineering/authors'

export const dynamic = 'force-dynamic'

export default async function EngineeringAuthorsPage() {
  const authors = await listPublishedAuthors()

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        <div>
          <Link href="/engineering" className="text-sm text-[var(--brand-navy)] underline font-medium">
            ← Field Notes
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-3">Authors</h1>
          <p className="text-slate-600 mt-2">
            Engineers and lecturers who publish field notes or share public profile updates.
          </p>
        </div>

        {authors.length === 0 ? (
          <p className="text-slate-600">No published authors yet.</p>
        ) : (
          <ul className="space-y-3">
            {authors.map((author) => (
              <li key={author.id}>
                <Link
                  href={`/engineering/authors/${author.id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[var(--brand-navy)]/30"
                >
                  <p className="font-semibold text-slate-900">{author.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {[
                      author.articleCount > 0
                        ? `${author.articleCount} article${author.articleCount === 1 ? '' : 's'}`
                        : null,
                      author.postCount > 0
                        ? `${author.postCount} post${author.postCount === 1 ? '' : 's'}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Public profile'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
