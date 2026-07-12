import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { LibraryViewTracker } from '@/components/library/library-view-tracker'
import { PublicCommentPanel } from '@/components/engineering/public-comment-panel'
import { getSessionUser } from '@/lib/auth/session-user'
import {
  cultureTypeLabel,
  pillarLabel,
} from '@/lib/library/items'
import { loadPublishedLibraryItemBySlug } from '@/lib/library/queries'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const item = await loadPublishedLibraryItemBySlug(slug)
  if (!item) return { title: 'Energy Library' }
  return {
    title: `${item.title} | Energy Library`,
    description: item.description || item.body?.slice(0, 160) || undefined,
  }
}

export default async function LibraryItemPage({ params }: PageProps) {
  const { slug } = await params
  const item = await loadPublishedLibraryItemBySlug(slug)
  if (!item) notFound()

  const user = await getSessionUser()
  const cultureLabelText = cultureTypeLabel(item.culture_type)

  return (
    <main className="min-h-screen bg-slate-50">
      <LibraryViewTracker slug={slug} />
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        <nav className="text-sm text-slate-600">
          <Link href="/library" className="text-[var(--brand-navy)] underline font-medium">
            Energy Library
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/library?category=${item.pillar}`}
            className="text-[var(--brand-navy)] underline font-medium"
          >
            {pillarLabel(item.pillar)}
          </Link>
        </nav>

        <header className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full border border-slate-300 px-2 py-0.5">
              {pillarLabel(item.pillar)}
            </span>
            {cultureLabelText ? (
              <span className="rounded-full border border-slate-300 px-2 py-0.5">{cultureLabelText}</span>
            ) : null}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{item.title}</h1>
          {item.description ? <p className="text-lg text-slate-600">{item.description}</p> : null}
          {item.author_name ? (
            <p className="text-sm text-slate-500">By {item.author_name}</p>
          ) : null}
        </header>

        {item.cover_image_url && item.pillar !== 'gallery' ? (
          <div className="relative aspect-[16/9] max-h-80 w-full overflow-hidden rounded-xl border bg-slate-100">
            <Image
              src={item.cover_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        ) : null}

        {item.pillar === 'gallery' ? (
          <section className="space-y-4">
            {item.gallery_images.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {item.gallery_images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-slate-100"
                  >
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            ) : item.cover_image_url ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-slate-100">
                <Image src={item.cover_image_url} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <p className="text-slate-600">No images in this gallery yet.</p>
            )}
          </section>
        ) : null}

        {item.pillar === 'books' && item.file_url ? (
          <section className="space-y-4">
            <div className="rounded-xl border bg-white overflow-hidden">
              <iframe
                src={item.file_url}
                title={item.title}
                className="w-full h-[min(80vh,720px)]"
              />
            </div>
            <p className="text-sm text-slate-600">
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-navy)] underline font-medium"
              >
                Open PDF in a new tab
              </a>
            </p>
          </section>
        ) : null}

        {item.pillar === 'books' && !item.file_url ? (
          <p className="text-slate-600">This book file is not available yet.</p>
        ) : null}

        {item.body ? (
          <section className="prose prose-slate max-w-none rounded-xl border bg-white p-6">
            {item.body.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        ) : null}

        {item.pillar === 'culture' && !item.body && !item.file_url ? (
          <p className="text-slate-600">Culture content will appear here when published.</p>
        ) : null}

        {item.pillar === 'culture' ? (
          <PublicCommentPanel
            fetchUrl={`/api/library/${slug}/comments`}
            postUrl={`/api/library/${slug}/comments`}
            title="Reader comments"
            emptyLabel="No comments yet. Sign in to share your thoughts on this piece."
            isSignedIn={Boolean(user?.id)}
          />
        ) : null}
      </div>
      <SiteFooter />
    </main>
  )
}
