'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  acceptAdminApplication,
  declineAdminApplication,
  listAdminApplications,
  type AdminApplicationRow,
} from '@/app/actions/admin-applications'
import DashboardTable from '@/app/admin/dashboard/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<AdminApplicationRow[]>([])
  const [registrations, setRegistrations] = useState<AdminApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await listAdminApplications()
    if (!result.success) {
      setError(result.error || 'Failed to load applications')
      setApplications([])
      setRegistrations([])
    } else {
      setApplications(result.applications ?? [])
      setRegistrations(result.registrations ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <p className="text-muted-foreground">Loading applications…</p>
  }

  const total = applications.length + registrations.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review internship, training, and registration submissions. Overview counts{' '}
          <strong>{applications.length}</strong> program application(s) in the database
          {registrations.length ? ` plus ${registrations.length} registration(s)` : ''}.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      ) : null}

      {!error && total === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No submissions yet. New applications from the public site will appear here.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Program applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No program applications yet.</p>
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
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
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
    </div>
  )
}
