'use client'

import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { ToolsCenterHub } from '@/components/tools/tools-center-hub'

export default function EngineerToolsPage() {
  return (
    <EngineerPageFrame
      title="Tools Center"
      description="Field calculators and cognitive readiness drills"
    >
      <div className="max-w-5xl">
        <ToolsCenterHub
          calculatorsHref="/tools/calculators"
          brainHref="/tools/brain-training"
        />
      </div>
    </EngineerPageFrame>
  )
}
