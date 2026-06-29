'use client'

import { useEffect, useState } from 'react'
import { revokeStudentEnrollmentAccess } from '@/app/actions/admin-enrollments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AdminAssessmentsPanel } from '@/components/admin/admin-assessments-panel'
import { Mail, Phone, RotateCcw } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Enrollment = {
  id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string
  user_id?: string | null
  motivation?: string | null
  amount_due: number
  status: string
  created_at: string
  access_starts_at?: string | null
  access_ends_at?: string | null
  admitted_at?: string | null
  course?: { id: string; title: string; pricing?: number }
}

const STATUS_OPTIONS = [
  'payment_pending_review',
  'admitted',
  'payment_rejected',
  'waitlisted',
  'cancelled',
  'refunded',
]

function statusBadge(status: string) {
  if (status === 'admitted') return <Badge className="bg-green-100 text-green-700">Admitted</Badge>
  if (status === 'refunded') return <Badge className="bg-slate-200 text-slate-800">Refunded</Badge>
  if (status === 'payment_rejected') return <Badge className="bg-red-100 text-red-700">Payment rejected</Badge>
  if (status === 'waitlisted') return <Badge className="bg-blue-100 text-blue-700">Waitlisted</Badge>
  if (status === 'cancelled') return <Badge className="bg-slate-100 text-slate-700">Cancelled</Badge>
  return <Badge className="bg-yellow-100 text-yellow-800">Pending review</Badge>
}

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filter, setFilter] = useState<'admitted' | 'pending' | 'rejected' | 'all'>('admitted')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<Enrollment | null>(null)
  const [revokeNotes, setRevokeNotes] = useState('')
  const [deleteReceiptOnRevoke, setDeleteReceiptOnRevoke] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

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
    setError('')
    const res = await fetch('/api/admin/enrollments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Update failed')
      return
    }
    load()
  }

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return
    setActionLoading(true)
    setError('')

    const result = await revokeStudentEnrollmentAccess({
      enrollmentId: revokeTarget.id,
      adminNotes: revokeNotes,
      deleteReceipt: deleteReceiptOnRevoke,
    })

    setActionLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to revoke access')
      return
    }

    setRevokeTarget(null)
    setRevokeNotes('')
    setDeleteReceiptOnRevoke(true)
    load()
  }

  if (loading) return <p className="text-muted-foreground">Loading enrollments...</p>

  const filtered = enrollments.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'admitted') return row.status === 'admitted'
    if (filter === 'pending') return row.status === 'payment_pending_review'
    if (filter === 'rejected') return row.status === 'payment_rejected'
    return true
  })

  return (
    <div className="space-y-6 app-form-surface">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active enrollments</h1>
        <p className="text-slate-600 mt-1">
          Students appear here after you approve their payment under{' '}
          <strong>Applications → Programme enrollments</strong>. Pending payments stay in Applications
          until reviewed.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      ) : null}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="admitted">
            Admitted ({enrollments.filter((e) => e.status === 'admitted').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({enrollments.filter((e) => e.status === 'payment_pending_review').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({enrollments.filter((e) => e.status === 'payment_rejected').length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({enrollments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4">
      {filtered.length === 0 ? (
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
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-slate-900">{row.course?.title ?? 'Course'}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(row.created_at).toLocaleString()} · {Number(row.amount_due).toLocaleString()} RWF
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge(row.status)}
                    {row.status === 'admitted' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-900 hover:bg-amber-50"
                        onClick={() => setRevokeTarget(row)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Refund &amp; revoke access
                      </Button>
                    ) : null}
                    <Select
                      value={row.status}
                      onValueChange={(v) => {
                        if (v === 'refunded') {
                          setRevokeTarget(row)
                          return
                        }
                        updateStatus(row.id, v)
                      }}
                    >
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
                <p className="font-medium text-slate-900">{row.applicant_name}</p>
                <p className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${row.applicant_email}`} className="hover:underline">{row.applicant_email}</a>
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${row.applicant_phone}`} className="hover:underline">{row.applicant_phone}</a>
                </p>
                {row.motivation ? <p className="text-slate-600">{row.motivation}</p> : null}
                {row.access_starts_at || row.access_ends_at ? (
                  <p className="text-xs text-slate-500 pt-1">
                    Access:{' '}
                    {row.access_starts_at
                      ? new Date(row.access_starts_at).toLocaleDateString()
                      : '—'}{' '}
                    →{' '}
                    {row.access_ends_at
                      ? new Date(row.access_ends_at).toLocaleDateString()
                      : 'open-ended'}
                  </p>
                ) : null}
                {row.user_id ? (
                  <p className="text-xs text-green-700">Linked to user account</p>
                ) : (
                  <p className="text-xs text-amber-700">No linked account (legacy enrollment)</p>
                )}
                {row.status === 'admitted' && row.course?.id ? (
                  <AdminAssessmentsPanel courseId={row.course.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null)
            setRevokeNotes('')
            setDeleteReceiptOnRevoke(true)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund and revoke course access?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>{revokeTarget?.applicant_name}</strong> will lose access to{' '}
                  <strong>{revokeTarget?.course?.title ?? 'this course'}</strong>. Any linked
                  approved payment is marked refunded so they can enroll again after a new payment.
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="delete-receipt-enroll"
                    checked={deleteReceiptOnRevoke}
                    onCheckedChange={(checked) => setDeleteReceiptOnRevoke(checked === true)}
                  />
                  <Label htmlFor="delete-receipt-enroll" className="font-normal cursor-pointer">
                    Delete receipt file from storage
                  </Label>
                </div>
                <div>
                  <Label htmlFor="revoke-notes">Reason / admin notes</Label>
                  <Input
                    id="revoke-notes"
                    placeholder="e.g. Full MoMo refund processed"
                    value={revokeNotes}
                    onChange={(e) => setRevokeNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(e) => {
                e.preventDefault()
                handleRevokeConfirm()
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading ? 'Processing…' : 'Confirm refund & revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
