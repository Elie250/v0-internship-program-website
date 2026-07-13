'use client'

import { useCallback, useEffect, useState } from 'react'
import { reviewPayment } from '@/app/actions/admin-payments'
import type { EngineerSubscriptionApplication } from '@/lib/admin/data/engineer-subscriptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default function EngineerSubscriptionsManagement({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [rows, setRows] = useState<EngineerSubscriptionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/engineer-subscriptions?filter=${tab}`, {
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
    const action = reviewAction
    if (!action) return
    setActionLoading(true)
    setError('')
    try {
      const result = await reviewPayment({
        id: action.paymentId,
        decision: action.decision,
        adminNotes: notes[action.paymentId],
      })
      if (!result.success) {
        setError(result.error || 'Review failed')
        return
      }
      setReviewAction(null)
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 app-form-surface'}>
      {!embedded ? (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engineer subscriptions</h1>
          <p className="text-slate-600 mt-1">
            Review MoMo receipts for engineering support plans. Approved engineers can open support
            tickets from their dashboard.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'history')}>
        <TabsList>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="history">Active &amp; processed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-4">
          {loading ? (
            <p className="text-slate-600">Loading…</p>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-600 text-sm">
                {tab === 'pending' ? 'No pending engineer subscription payments.' : 'No records yet.'}
              </CardContent>
            </Card>
          ) : (
            rows.map((row) => (
              <Card key={row.subscriptionId}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{row.subscriberName}</CardTitle>
                      <p className="text-sm text-slate-600">
                        {row.subscriberEmail}
                        {row.subscriberPhone ? ` · ${row.subscriberPhone}` : ''}
                      </p>
                    </div>
                    <Badge
                      className={
                        row.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : row.status === 'payment_pending_review'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-800'
                      }
                    >
                      {row.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Plan</p>
                      <p className="font-semibold">{row.plan?.name ?? '—'}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Amount</p>
                      <p className="font-semibold">
                        {(row.payment?.amount ?? row.plan?.price ?? 0).toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase">Duration</p>
                      <p className="font-semibold">
                        {row.plan?.durationDays ? `${row.plan.durationDays} days` : '—'}
                      </p>
                    </div>
                  </div>

                  {row.payment?.receiptUrl ? (
                    <a
                      href={row.payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--brand-navy)] underline"
                    >
                      View receipt <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}

                  {tab === 'pending' && row.payment?.id ? (
                    <div className="border-t pt-3 space-y-2">
                      <Label>Notes / rejection reason</Label>
                      <Textarea
                        value={notes[row.payment.id] ?? ''}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [row.payment!.id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() =>
                            setReviewAction({
                              paymentId: row.payment!.id,
                              decision: 'approved',
                              label: row.subscriberName,
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-800"
                          onClick={() =>
                            setReviewAction({
                              paymentId: row.payment!.id,
                              decision: 'rejected',
                              label: row.subscriberName,
                            })
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!reviewAction}
        onOpenChange={(open) => {
          if (!open && !actionLoading) setReviewAction(null)
        }}
      >
        <AlertDialogContent className="admin-form-dialog border-slate-400 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-950">
              {reviewAction?.decision === 'approved' ? 'Activate subscription?' : 'Reject payment?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-800">
              {reviewAction?.decision === 'approved'
                ? 'The engineer will receive a confirmation email and can use support tickets.'
                : 'The engineer will be emailed with your rejection reason.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading} className="border-slate-500 text-slate-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              className={
                reviewAction?.decision === 'approved'
                  ? 'bg-green-700 hover:bg-green-800 text-white'
                  : 'bg-red-700 hover:bg-red-800 text-white'
              }
              onClick={(e) => {
                e.preventDefault()
                void confirmReview()
              }}
            >
              {actionLoading ? 'Processing…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
