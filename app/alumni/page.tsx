import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { AlumniDirectory } from '@/components/alumni/alumni-directory'
import { loadPublicAlumniProfiles } from '@/lib/alumni/profiles'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Alumni',
  description: 'Graduates and programme alumni from Energy & Logics Academy.',
}

export default async function AlumniPage() {
  const profiles = await loadPublicAlumniProfiles()

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Community</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Alumni directory</h1>
          <p className="text-slate-600 max-w-2xl">
            Meet graduates who chose to share their programme story, headline, and professional links.
          </p>
        </header>
        <AlumniDirectory profiles={profiles} />
      </div>
      <SiteFooter />
    </main>
  )
}
