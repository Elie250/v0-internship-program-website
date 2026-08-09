'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { StudentsRegistryPanel } from '@/components/admin/students-registry-panel'

export default function StudentsManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Students"
        description="Monitor learner accounts, open or close registration-period name/password edits, and lock individual students. Export the registry for reporting."
      />
      <StudentsRegistryPanel />
    </div>
  )
}
