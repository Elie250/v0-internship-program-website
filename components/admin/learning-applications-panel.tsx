'use client'

import { useCallback, useEffect, useState } from 'react'
import { reviewPayment } from '@/app/actions/admin-payments'
import type { LearningApplicationRow } from '@/lib/admin/data/learning-applications'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'

type ReviewAction = { paymentId: string; decision: 'approved' | 'rejected'; label: string }

export function LearningApplicationsPanel() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [rows, setRows] = useState<LearningApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/learning-applications?filter=${tab}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  const confirmReview = async () => {
    if (!reviewAction) return
    setActionLoading(true)
    setError('')
    const result = await reviewPayment({
      id: reviewAction.paymentId,
      decision: reviewAction.decision,
      adminNotes: notes[reviewAction.paymentId],
    })
    setActionLoading(false)
    if (!result.success) {
      setError(result.error || 'Review failed')
      return
    }
    setReviewAction(null)
    void load()
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'history')}>
        <TabsList>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="history">Processed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-4">
          {error ? (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p className="text-muted-foreground">Loading programme applications…</p>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                {tab === 'pending'
                  ? 'No pending enrollment payments. New student enrollments with MoMo receipts appear here.'
                  : 'No processed applications yet.'}
              </CardContent>
            </Card>
          ) : (
            rows.map((row) => (
              <Card key={row.enrollmentId}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-slate-900">{row.applicantName}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        {row.applicantEmail}
                        {row.applicantPhone ? ` · ${row.applicantPhone}` : ''}
                      </p>
                    </div>
                    <Badge
                      className={
                        row.status === 'admitted'
                          ? 'bg-green-100 text-green-800'
                          : row.status === 'payment_rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900'
                      }
                    >
                      {row.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Programme</p>
                      <p className="font-semibold text-slate-900">{row.course?.title ?? '—'}</p>
                      {row.course?.program_type ? (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {PROGRAM_TYPE_LABELS[row.course.program_type as ProgramType] ?? row.course.program_type}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Amount</p>
                      <p className="font-semibold text-slate-900">
                        {(row.payment?.amount ?? row.amountDue).toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Duration</p>
                      <p className="font-semibold text-slate-900">{row.course?.duration ?? '—'}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Starts</p>
                      <p className="font-semibold text-slate-900">
                        {row.course?.scheduled_at
                          ? new Date(row.course.scheduled_at).toLocaleDateString()
                          : row.accessStartsAt
                            ? new Date(row.accessStartsAt).toLocaleDateString()
                            : 'On approval'}
                      </p>
                    </div>
                  </div>

                  {row.motivation ? (
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-800">Motivation:</span> {row.motivation}
                    </p>
                  ) : null}

                  {row.rejectionReason ? (
                    <p className="text-red-800 bg-red-50 border border-red-100 rounded-md p-2">
                      <span className="font-medium">Rejection reason:</span> {row.rejectionReason}
                    </p>
                  ) : null}

                  {row.payment?.receiptUrl ? (
                    <a
                      href={row.payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--brand-navy)] underline text-sm"
                    >
                      View MoMo receipt <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-amber-800 text-xs">No receipt linked to this enrollment yet.</p>
                  )}

                  {tab === 'pending' && row.payment?.id ? (
                    <div className="border-t pt-3 space-y-2">
                      <Label htmlFor={`notes-${row.payment.id}`}>Admin notes / rejection reason</Label>
                      <Textarea
                        id={`notes-${row.payment.id}`}
                        className="min-h-[72px]"
                        placeholder="Optional for approval. Required context for rejection (shown to student)."
                        value={notes[row.payment.id] ?? ''}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [row.payment!.id]: e.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() =>
                            setReviewAction({
                              paymentId: row.payment!.id,
                              decision: 'approved',
                              label: row.applicantName,
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve & enroll
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-800 hover:bg-red-50"
                          onClick={() =>
                            setReviewAction({
                              paymentId: row.payment!.id,
                              decision: 'rejected',
                              label: row.applicantName,
                            })
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-xs text-slate-500">
                    Submitted {new Date(row.createdAt).toLocaleString()}
                    {row.payment?.receiptNumber ? ` · Ref ${row.payment.receiptNumber}` : ''}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!reviewAction} onOpenChange={(open) => !open && setReviewAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction?.decision === 'approved' ? 'Approve enrollment?' : 'Reject payment?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction?.decision === 'approved'
                ? `${reviewAction?.label} will be admitted, receive a confirmation email, and appear under Enrollments.`
                : `${reviewAction?.label} will be notified by email with your rejection reason.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReview} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
