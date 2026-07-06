'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminApplicationRow } from '@/lib/admin/data/applications'
import { LearningApplicationsPanel } from '@/components/admin/learning-applications-panel'
import { StudentsRegistryPanel } from '@/components/admin/students-registry-panel'
import DashboardTable from '@/app/admin/dashboard/table'
import {
  acceptAdminApplication,
  declineAdminApplication,
} from '@/app/actions/admin-applications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<AdminApplicationRow[]>([])
  const [registrations, setRegistrations] = useState<AdminApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/applications', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load applications')
        setApplications([])
        setRegistrations([])
        return
      }
      setApplications(Array.isArray(data.applications) ? data.applications : [])
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
      setApplications([])
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const legacyTotal = applications.length + registrations.length

  return (
    <div className="space-y-6 app-form-surface">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All applications</h1>
        <p className="text-slate-600 mt-1">
          Programme enrollments with MoMo receipts are reviewed under <strong>Programme enrollments</strong>.
          The <strong>All students</strong> tab lists every student account with contact details and
          programme history. Shop payments go to <strong>Orders</strong>.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}

      <Tabs defaultValue="learning">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger
            value="learning"
            className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
          >
            Programme enrollments
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
          >
            All students
          </TabsTrigger>
          {legacyTotal > 0 ? (
            <TabsTrigger
              value="legacy"
              className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
            >
              Legacy forms ({legacyTotal})
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="learning" className="mt-4">
          <LearningApplicationsPanel />
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <StudentsRegistryPanel />
        </TabsContent>

        {legacyTotal > 0 ? (
          <TabsContent value="legacy" className="mt-4 space-y-6">
            {loading ? (
              <p className="text-slate-600">Loading legacy applications…</p>
            ) : (
              <>
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">
                      Program applications ({applications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <p className="text-sm text-slate-600">None</p>
                    ) : (
                      <DashboardTable
                        registrations={applications}
                        source="applications"
                        onAccept={acceptAdminApplication}
                        onDecline={declineAdminApplication}
                        onUpdated={load}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">
                      Registrations ({registrations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {registrations.length === 0 ? (
                      <p className="text-sm text-slate-600">None</p>
                    ) : (
                      <DashboardTable
                        registrations={registrations}
                        source="registrations"
                        onAccept={acceptAdminApplication}
                        onDecline={declineAdminApplication}
                        onUpdated={load}
                      />
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
