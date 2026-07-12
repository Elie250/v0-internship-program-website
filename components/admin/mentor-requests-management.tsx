'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'

type MentorRequest = {
  id: string
  fullName: string
  email: string
  phone: string | null
  focusArea: string
  message: string | null
  status: string
  createdAt: string
}

export default function MentorRequestsManagement() {
  const [rows, setRows] = useState<MentorRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/admin/mentor-requests')
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/mentor-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await load()
  }

  if (loading) return <p className="text-slate-600">Loading mentor requests…</p>

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Mentor matching"
        description="Review mentorship requests from the career page and mark them matched or closed."
      />

      <Card>
        <CardHeader>
          <CardTitle>Requests ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">No requests yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold text-slate-900">{row.fullName}</p>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{row.status}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {row.email}
                  {row.phone ? ` · ${row.phone}` : ''}
                </p>
                <p className="text-sm">
                  <strong>Focus:</strong> {row.focusArea}
                </p>
                {row.message ? <p className="text-sm text-slate-700">{row.message}</p> : null}
                <div className="flex gap-2 pt-2">
                  {row.status === 'pending' ? (
                    <>
                      <Button size="sm" onClick={() => void updateStatus(row.id, 'matched')}>
                        Mark matched
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void updateStatus(row.id, 'closed')}>
                        Close
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
