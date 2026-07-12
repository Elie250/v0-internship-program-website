import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { FieldNotesArticleCard } from '@/components/engineering/field-notes-article'
import { loadPublicAuthorProfile } from '@/lib/engineering/authors'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

function roleLabel(role: string) {
  if (role === 'engineer') return 'Engineer'
  if (role === 'lecturer' || role === 'instructor') return 'Lecturer'
  if (role === 'support_staff') return 'Support staff'
  return 'Author'
}

export default async function EngineeringAuthorPage({ params }: PageProps) {
  const { id } = await params
  const author = await loadPublicAuthorProfile(id)
  if (!author) notFound()

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
        <Link href="/engineering" className="text-sm text-[var(--brand-navy)] underline font-medium">
          ← Field Notes
        </Link>

        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-wrap gap-6">
          <div className="relative h-32 w-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
            {author.photoUrl ? (
              <Image src={author.photoUrl} alt={author.name} fill className="object-cover object-top" unoptimized />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-semibold text-[var(--brand-navy)]">
                {author.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{author.name}</h1>
            {author.title ? <p className="text-slate-600">{author.title}</p> : null}
            <Badge variant="outline">{roleLabel(author.role)}</Badge>
            {author.bio ? (
              <p className="text-sm text-slate-700 whitespace-pre-line pt-2">{author.bio}</p>
            ) : null}
            {author.cvUrl ? (
              <a
                href={author.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] underline"
              >
                View CV <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </section>

        {(author.education || author.experience || author.qualifications) ? (
          <section className="grid sm:grid-cols-3 gap-4">
            {author.education ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{author.education}</p>
              </div>
            ) : null}
            {author.experience ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{author.experience}</p>
              </div>
            ) : null}
            {author.qualifications ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{author.qualifications}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Articles by {author.name}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {author.articles.map((article) => (
              <FieldNotesArticleCard key={article.id} article={{ ...article, bodyLocked: false, lockReason: null }} />
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}
