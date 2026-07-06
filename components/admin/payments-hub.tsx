'use client'

import dynamic from 'next/dynamic'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PaymentVerificationPanel = dynamic(
  () => import('@/components/admin/payment-verification'),
  { loading: () => <p className="text-sm text-slate-600">Loading payments…</p> }
)

const EngineerSubscriptionsManagement = dynamic(
  () => import('@/components/admin/engineer-subscriptions-management'),
  { loading: () => <p className="text-sm text-slate-600">Loading engineer subscriptions…</p> }
)

export default function PaymentsHub() {
  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="E-learning payments"
        description="Verify MoMo receipts for programme enrollments and engineer support plans. Product order receipts appear here too."
      />
      <Tabs defaultValue="programme">
        <TabsList className="bg-white border border-slate-200 w-full sm:w-auto flex">
          <TabsTrigger
            value="programme"
            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
          >
            Programme enrollments
          </TabsTrigger>
          <TabsTrigger
            value="engineer"
            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
          >
            Engineer plans
          </TabsTrigger>
        </TabsList>
        <TabsContent value="programme" className="mt-4">
          <PaymentVerificationPanel embedded />
        </TabsContent>
        <TabsContent value="engineer" className="mt-4">
          <EngineerSubscriptionsManagement embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
