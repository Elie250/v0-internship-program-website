'use client'

import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { EngineersRegistryPanel } from '@/components/admin/engineers-registry-panel'

export default function EngineersManagement() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Engineers"
        description="Engineering support staff — subscription status, open tickets, and account management."
      />
      <EngineersRegistryPanel />
    </div>
  )
}
