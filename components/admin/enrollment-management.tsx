'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Phone } from 'lucide-react'

type Enrollment = {
  id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string
  motivation?: string | null
  amount_due: number
  status: string
  created_at: string
  course?: { id: string; title: string; pricing?: number }
}

const STATUS_OPTIONS = [
  'payment_pending_review',
  'admitted',
  'payment_rejected',
  'waitlisted',
  'cancelled',
]

function statusBadge(status: string) {
  if (status === 'admitted') return <Badge className="bg-green-100 text-green-700">Admitted</Badge>
  if (status === 'payment_rejected') return <Badge className="bg-red-100 text-red-700">Payment rejected</Badge>
  if (status === 'waitlisted') return <Badge className="bg-blue-100 text-blue-700">Waitlisted</Badge>
  return <Badge className="bg-yellow-100 text-yellow-800">Pending review</Badge>
}

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/enrollments', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setEnrollments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/enrollments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  if (loading) return <p className="text-muted-foreground">Loading enrollments...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course enrollments</h1>
        <p className="text-muted-foreground mt-1">
          Applications from the Learning portal. Approve payments under Payment Receipts to admit students automatically.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No enrollments yet. Published courses appear on{' '}
            <a href="/learning" className="text-[#1e3a5f] underline" target="_blank" rel="noopener noreferrer">
              /learning
            </a>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{row.course?.title ?? 'Course'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(row.created_at).toLocaleString()} · {Number(row.amount_due).toLocaleString()} RWF
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(row.status)}
                    <Select value={row.status} onValueChange={(v) => updateStatus(row.id, v)}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{row.applicant_name}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${row.applicant_email}`} className="hover:underline">{row.applicant_email}</a>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${row.applicant_phone}`} className="hover:underline">{row.applicant_phone}</a>
                </p>
                {row.motivation ? <p className="text-muted-foreground">{row.motivation}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
