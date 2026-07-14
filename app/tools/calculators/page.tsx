'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { EngineeringToolsPanel } from '@/components/tools/engineering-tools-panel'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const VALID_TABS = ['electrical', 'installation', 'embedded', 'solar'] as const

export default function ToolsCalculatorsPage() {
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
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Tools Center
          </Link>
        </div>
        <EngineeringToolsPanel key={defaultTab} defaultTab={defaultTab} className="mx-auto" />
        <div className="text-center mt-8">
          <Link href="/tools/brain-training">
            <Button variant="outline" className="border-slate-300 text-slate-900">
              Try Brain Training Academy
            </Button>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
