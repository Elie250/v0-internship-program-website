'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  acceptAdminApplication,
  declineAdminApplication,
} from '@/app/actions/admin-applications'
import type { AdminApplicationRow } from '@/lib/admin/data/applications'
import { LearningApplicationsPanel } from '@/components/admin/learning-applications-panel'
import DashboardTable from '@/app/admin/dashboard/table'
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
          Programme enrollments with MoMo receipts are reviewed here first. After approval, students
          move to <strong>Learning → Enrollments</strong>. Shop payments go to <strong>Orders</strong>;
          engineer subscriptions use <strong>Engineer subscriptions</strong>.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      ) : null}

      <Tabs defaultValue="learning">
        <TabsList>
          <TabsTrigger value="learning">Programme enrollments</TabsTrigger>
          <TabsTrigger value="legacy">Legacy forms ({legacyTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="learning" className="mt-4">
          <LearningApplicationsPanel />
        </TabsContent>

        <TabsContent value="legacy" className="mt-4 space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Loading legacy applications…</p>
          ) : legacyTotal === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No legacy form submissions. Public internship/training forms appear here if used.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Program applications ({applications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Registrations ({registrations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None</p>
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
      </Tabs>
    </div>
  )
}
