'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { LecturersRegistryPanel } from '@/components/admin/lecturers-registry-panel'

export default function LecturersManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Lecturers"
        description="Teaching staff who deliver programmes through the classroom portal. Review assignments and account status."
      />
      <LecturersRegistryPanel />
    </div>
  )
}
