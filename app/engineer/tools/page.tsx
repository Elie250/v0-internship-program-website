'use client'

import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineeringToolsPanel } from '@/components/tools/engineering-tools-panel'

export default function EngineerToolsPage() {
  return (
    <EngineerPageFrame title="Engineering tools" description="Field calculators and references">
      <div className="max-w-5xl">
        <EngineeringToolsPanel />
      </div>
    </EngineerPageFrame>
  )
}
