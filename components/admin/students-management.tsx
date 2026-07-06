'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { StudentsRegistryPanel } from '@/components/admin/students-registry-panel'

export default function StudentsManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Students"
        description="Monitor every learner account — contact details, enrollment status, and programme history. Export the registry for reporting."
      />
      <StudentsRegistryPanel />
    </div>
  )
}
