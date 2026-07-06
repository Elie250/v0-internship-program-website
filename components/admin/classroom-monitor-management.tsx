'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { ClassroomMonitorPanel } from '@/components/admin/classroom-monitor-panel'

export default function ClassroomMonitorManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Classroom monitor"
        description="Read-only view of live sessions across all programmes — schedule, lecturer, and meeting links."
      />
      <ClassroomMonitorPanel />
    </div>
  )
}
