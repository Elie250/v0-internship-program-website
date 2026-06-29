'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardTable from '@/app/admin/dashboard/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const [applicationsRes, registrationsRes] = await Promise.all([
          supabase.from('applications').select('*').order('created_at', { ascending: false }),
          supabase.from('registrations').select('*').order('created_at', { ascending: false }),
        ])

        setApplications(applicationsRes.data ?? [])
        setRegistrations(registrationsRes.data ?? [])
      } catch (error) {
        console.error('Failed to load applications:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <p className="text-muted-foreground">Loading applications…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review internship, training, and registration submissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <DashboardTable registrations={applications} />
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
            <DashboardTable registrations={registrations} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
