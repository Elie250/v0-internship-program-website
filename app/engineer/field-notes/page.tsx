'use client'

import Link from 'next/link'
import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerFieldNotesPanel } from '@/components/engineer/engineer-field-notes-panel'

export default function EngineerFieldNotesPage() {
  return (
    <EngineerPageFrame
      title="Field Notes"
      description="Write practical articles"
      headerAction={
        <Link
          href="/engineering"
          className="text-sm font-medium text-[var(--brand-navy)] underline"
          target="_blank"
        >
          View public blog
        </Link>
      }
    >
      <div className="max-w-4xl">
        <EngineerFieldNotesPanel />
      </div>
    </EngineerPageFrame>
  )
}
