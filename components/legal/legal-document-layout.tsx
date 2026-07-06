import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { COMPANY } from '@/lib/company/constants'
import { LEGAL_LAST_UPDATED } from '@/lib/legal/content'

export function LegalDocumentLayout({
  title,
  intro,
  sections,
}: {
  title: string
  intro: string
  sections: Array<{ title: string; body: string }>
}) {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-sm mb-2">{COMPANY.brandName} Ltd</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
          <p className="text-white/85">{intro}</p>
          <p className="text-white/60 text-sm mt-3">Last updated: {LEGAL_LAST_UPDATED}</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--brand-navy)]">{section.title}</h2>
            <p className="text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {section.body}
            </p>
          </section>
        ))}

        <div className="border-t pt-6 text-sm text-slate-600 space-y-2">
          <p>
            Related:{' '}
            <Link href="/terms" className="text-[var(--brand-navy)] underline underline-offset-2">
              Terms & Conditions
            </Link>
            {' · '}
            <Link href="/privacy" className="text-[var(--brand-navy)] underline underline-offset-2">
              Privacy Policy
            </Link>
            {' · '}
            <Link href="/refund-policy" className="text-[var(--brand-navy)] underline underline-offset-2">
              Refund Policy
            </Link>
          </p>
          <p>
            Questions?{' '}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--brand-navy)] underline">
              {COMPANY.email}
            </a>
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
