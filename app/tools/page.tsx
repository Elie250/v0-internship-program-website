'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import {
  EngineeringToolsPanel,
} from '@/components/tools/engineering-tools-panel'
import { Button } from '@/components/ui/button'

const VALID_TABS = ['electrical', 'installation', 'embedded', 'solar'] as const

export default function ToolsPage() {
  const [defaultTab, setDefaultTab] = useState<string>('electrical')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if ((VALID_TABS as readonly string[]).includes(hash)) {
      setDefaultTab(hash)
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 app-form-surface">
        <EngineeringToolsPanel key={defaultTab} defaultTab={defaultTab} className="mx-auto" />
        <p className="text-center text-sm text-slate-600 mt-10 max-w-xl mx-auto">
          Enrolled students can also open these tools from{' '}
          <Link href="/student/tools" className="text-[var(--brand-navy)] font-medium underline">
            My learning → Tools
          </Link>
          .{' '}
          <Link href="/auth/login" className="text-[var(--brand-navy)] font-medium underline">
            Log in
          </Link>{' '}
          for course materials and certificates.
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
