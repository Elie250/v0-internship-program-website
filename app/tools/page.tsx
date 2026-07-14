'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { ToolsCenterHub } from '@/components/tools/tools-center-hub'
import { Button } from '@/components/ui/button'

const CALC_HASHES = ['electrical', 'installation', 'embedded', 'solar']

export default function ToolsPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (CALC_HASHES.includes(hash)) {
      router.replace(`/tools/calculators#${hash}`)
    }
  }, [router])

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 app-form-surface">
        <ToolsCenterHub
          calculatorsHref="/tools/calculators"
          brainHref="/tools/brain-training"
        />
        <p className="text-center text-sm text-slate-600 mt-10 max-w-xl mx-auto">
          Students: open the full academy with saved progress from{' '}
          <Link href="/student/tools" className="text-[var(--brand-navy)] font-medium underline">
            My learning → Tools
          </Link>
          .{' '}
          <Link href="/auth/login" className="text-[var(--brand-navy)] font-medium underline">
            Log in
          </Link>{' '}
          to track scores.
        </p>
        <div className="text-center mt-4">
          <Link href="/learning">
            <Button variant="outline" className="text-slate-900 border-slate-300">
              Browse training programmes
            </Button>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
