'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { LearningAnalyticsPanel } from '@/components/admin/learning-analytics-panel'

export default function LearningAnalyticsManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Learning analytics"
        description="Programme-level view of enrollments, average lesson progress, upcoming sessions, certificates awaiting approval, and at-risk learners."
      />
      <LearningAnalyticsPanel />
    </div>
  )
}
