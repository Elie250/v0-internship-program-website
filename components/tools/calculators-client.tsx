'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EngineeringToolsPanel } from '@/components/tools/engineering-tools-panel'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  CALCULATOR_FOLDERS,
  CALCULATOR_TOOLS,
} from '@/lib/engineering/calculator-catalog'

const VALID_HASHES = new Set([
  ...CALCULATOR_FOLDERS.map((f) => f.id),
  ...CALCULATOR_TOOLS.map((t) => t.id),
])

export function CalculatorsClient() {
  const [defaultTab, setDefaultTab] = useState<string | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (VALID_HASHES.has(hash)) {
      setDefaultTab(hash)
    }
    setReady(true)
  }, [])

  return (
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
      {ready ? (
        <EngineeringToolsPanel
          key={defaultTab ?? 'folders'}
          defaultTab={defaultTab}
          className="mx-auto"
        />
      ) : null}
      <div className="text-center mt-8">
        <Link href="/tools/brain-training">
          <Button variant="outline" className="border-slate-300 text-slate-900">
            Try Brain Training Arcade
          </Button>
        </Link>
      </div>
    </div>
  )
}
