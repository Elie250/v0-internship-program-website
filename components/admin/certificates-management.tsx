'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { AdminAssessmentsPanel } from '@/components/admin/admin-assessments-panel'

export default function CertificatesManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Certificates"
        description="Final approval queue after lecturers confirm passing scores. Approved certificates are emailed to students with verification links."
      />
      <AdminAssessmentsPanel standalone />
    </div>
  )
}
