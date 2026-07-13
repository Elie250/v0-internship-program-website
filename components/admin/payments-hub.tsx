'use client'

import dynamic from 'next/dynamic'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const LearningApplicationsPanel = dynamic(
  () =>
    import('@/components/admin/learning-applications-panel').then((m) => ({
      default: m.LearningApplicationsPanel,
    })),
  { loading: () => <p className="text-sm text-slate-600">Loading enrollments…</p> }
)

const EngineerSubscriptionsManagement = dynamic(
  () => import('@/components/admin/engineer-subscriptions-management'),
  { loading: () => <p className="text-sm text-slate-600">Loading engineer subscriptions…</p> }
)

const LibraryPurchasesPanel = dynamic(
  () =>
    import('@/components/admin/library-purchases-panel').then((m) => ({
      default: m.LibraryPurchasesPanel,
    })),
  { loading: () => <p className="text-sm text-slate-600">Loading library purchases…</p> }
)

export default function PaymentsHub() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="E-learning payments"
        description="Review MoMo receipts for programme enrollments, Energy Library purchases, and engineer support plans. Product order payments are under Products → Product orders."
      />
      <Tabs defaultValue="programme">
        <TabsList className="admin-mobile-tabs bg-white border border-slate-300 w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger
            value="programme"
            className="flex-1 sm:flex-none min-h-10 data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white data-[state=active]:font-semibold text-slate-800 font-medium"
          >
            Programme enrollments
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className="flex-1 sm:flex-none min-h-10 data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white data-[state=active]:font-semibold text-slate-800 font-medium"
          >
            Library
          </TabsTrigger>
          <TabsTrigger
            value="engineer"
            className="flex-1 sm:flex-none min-h-10 data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white data-[state=active]:font-semibold text-slate-800 font-medium"
          >
            Engineer plans
          </TabsTrigger>
        </TabsList>
        <TabsContent value="programme" className="mt-4">
          <LearningApplicationsPanel />
        </TabsContent>
        <TabsContent value="library" className="mt-4">
          <LibraryPurchasesPanel />
        </TabsContent>
        <TabsContent value="engineer" className="mt-4">
          <EngineerSubscriptionsManagement embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
