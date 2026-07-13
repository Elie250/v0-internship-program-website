'use client'

import { useCallback, useEffect, useState } from 'react'
import { reviewPaymentRequest } from '@/lib/admin/review-payment-client'
import type { LibraryPurchaseRow } from '@/lib/admin/data/library-purchases'
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
import Link from 'next/link'

type ReviewAction = { paymentId: string; decision: 'approved' | 'rejected'; label: string }

export function LibraryPurchasesPanel() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [rows, setRows] = useState<LibraryPurchaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/library-purchases?filter=${tab}`, {
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
    setSuccess('')
    try {
      const result = await reviewPaymentRequest({
        id: action.paymentId,
        decision: action.decision,
        adminNotes: notes[action.paymentId],
      })
      if (!result.success) {
        setError(result.error || 'Review failed')
        return
      }
      setSuccess(
        action.decision === 'approved'
          ? 'Library purchase approved. The reader can now access the full item.'
          : 'Payment rejected.'
      )
      setReviewAction(null)
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setActionLoading(false)
    }
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
          {success ? (
            <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
              {success}
            </p>
          ) : null}
          {loading ? (
            <p className="text-slate-600">Loading library purchases…</p>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-600 text-sm">
                {tab === 'pending'
                  ? 'No pending library purchases. Paid book and culture requests appear here.'
                  : 'No processed library purchases yet.'}
              </CardContent>
            </Card>
          ) : (
            rows.map((row) => (
              <Card key={row.purchaseId}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{row.item?.title ?? 'Library item'}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        {row.buyerName} · {row.buyerEmail}
                        {row.buyerPhone ? ` · ${row.buyerPhone}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline">{row.status.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <span className="text-slate-500">Amount:</span>{' '}
                      {(row.payment?.amount ?? row.amountDue).toLocaleString()} RWF
                    </p>
                    <p>
                      <span className="text-slate-500">Submitted:</span>{' '}
                      {new Date(row.createdAt).toLocaleString()}
                    </p>
                    {row.item?.slug ? (
                      <p className="sm:col-span-2">
                        <Link
                          href={`/library/${row.item.slug}`}
                          className="text-[var(--brand-navy)] underline inline-flex items-center gap-1"
                          target="_blank"
                        >
                          View library item <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </p>
                    ) : null}
                  </div>

                  {row.payment?.receiptUrl ? (
                    <p>
                      <a
                        href={row.payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--brand-navy)] underline inline-flex items-center gap-1"
                      >
                        View MoMo receipt <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </p>
                  ) : null}

                  {tab === 'pending' && row.payment?.id ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${row.purchaseId}`}>Admin notes (optional)</Label>
                        <Textarea
                          id={`notes-${row.purchaseId}`}
                          value={notes[row.payment.id] ?? ''}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [row.payment!.id]: e.target.value }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800"
                          onClick={() =>
                            setReviewAction({
                              paymentId: row.payment!.id,
                              decision: 'approved',
                              label: row.item?.title ?? 'this library item',
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() =>
                            setReviewAction({
                              paymentId: row.payment!.id,
                              decision: 'rejected',
                              label: row.item?.title ?? 'this library item',
                            })
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(reviewAction)} onOpenChange={(open) => !open && setReviewAction(null)}>
        <AlertDialogContent className="admin-form-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction?.decision === 'approved' ? 'Approve library purchase?' : 'Reject payment?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction?.decision === 'approved'
                ? `Grant full access to ${reviewAction.label} after verifying the MoMo receipt.`
                : `Reject payment for ${reviewAction?.label}. The reader will not get access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(e) => {
                e.preventDefault()
                void confirmReview()
              }}
            >
              {actionLoading ? 'Processing…' : reviewAction?.decision === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
