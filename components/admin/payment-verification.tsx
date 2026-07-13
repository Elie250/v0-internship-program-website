'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  refundPayment,
  removePaymentReceipt,
  reviewPayment,
} from '@/app/actions/admin-payments'
import type { PaymentRecord } from '@/lib/admin/data/payments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ExternalLink, CheckCircle2, XCircle, RotateCcw, Trash2 } from 'lucide-react'

type RefundTarget = { id: string; payerLabel: string; mode: 'refund' | 'deleteReceipt' }

export default function PaymentVerificationPanel({ embedded = false }: { embedded?: boolean }) {
  const [pending, setPending] = useState<PaymentRecord[]>([])
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null)
  const [refundNotes, setRefundNotes] = useState('')
  const [deleteReceiptOnRefund, setDeleteReceiptOnRefund] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payments', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load pending payments')
        setPending([])
        setHistory([])
        return
      }
      setPending(Array.isArray(data.pending) ? data.pending : [])
      setHistory(Array.isArray(data.history) ? data.history : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments')
      setPending([])
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    setReviewingId(id)
    setError('')
    setSuccess('')
    const result = await reviewPayment({
      id,
      decision,
      adminNotes: notes[id],
    })
    setReviewingId(null)
    if (!result.success) {
      setError(result.error || 'Review failed')
      return
    }
    setSuccess(
      decision === 'approved'
        ? 'Payment approved'
        : 'Payment rejected'
    )
    load()
  }

  const handleRefundConfirm = async () => {
    if (!refundTarget) return
    setActionLoading(true)
    setError('')

    const result =
      refundTarget.mode === 'refund'
        ? await refundPayment({
            id: refundTarget.id,
            adminNotes: refundNotes,
            deleteReceipt: deleteReceiptOnRefund,
          })
        : await removePaymentReceipt({
            id: refundTarget.id,
            adminNotes: refundNotes,
          })

    setActionLoading(false)

    if (!result.success) {
      setError(result.error || 'Action failed')
      return
    }

    setRefundTarget(null)
    setRefundNotes('')
    setDeleteReceiptOnRefund(true)
    load()
  }

  const statusBadge = (status: string) => {
    if (status === 'approved' || status === 'Paid') {
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>
    }
    if (status === 'refunded') {
      return <Badge className="bg-slate-200 text-slate-800">Refunded</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending review</Badge>
  }

  const payerLabel = (payment: PaymentRecord) =>
    payment.payer_name || payment.payer_email || 'Unknown payer'

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product payment receipts</h1>
          <p className="text-slate-600 mt-1">
            Manual verification for shop and legacy application payments only. Programme enrollments are
            under <strong>Applications → Programme enrollments</strong>. Engineer plans use{' '}
            <strong>Engineer subscriptions</strong>.
          </p>
        </div>
      ) : null}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          {success}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending review ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-slate-600">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-slate-600">No payments awaiting receipt review.</p>
          ) : (
            pending.map((payment) => (
              <div key={payment.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {payerLabel(payment)} — {payment.amount?.toLocaleString()} RWF
                    </p>
                    <p className="text-sm text-slate-600">{payment.payer_email}</p>
                    {payment.payer_phone && (
                      <p className="text-sm text-slate-600">{payment.payer_phone}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Method: {payment.payment_method || 'N/A'}
                      {payment.receipt_number ? ` · Ref: ${payment.receipt_number}` : ''}
                      {payment.course_enrollment_id ? ' · Course enrollment' : ''}
                      {payment.support_subscription_id ? ' · Engineering support subscription' : ''}
                    </p>
                  </div>
                  {statusBadge(payment.status)}
                </div>

                {payment.receipt_url && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View receipt
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRefundTarget({
                          id: payment.id,
                          payerLabel: payerLabel(payment),
                          mode: 'deleteReceipt',
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove receipt file
                    </Button>
                  </div>
                )}

                <div>
                  <Label htmlFor={`notes-${payment.id}`}>Admin notes</Label>
                  <Input
                    id={`notes-${payment.id}`}
                    placeholder="Optional note after visual check…"
                    value={notes[payment.id] || ''}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [payment.id]: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={reviewingId === payment.id}
                    onClick={() => handleReview(payment.id, 'approved')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {reviewingId === payment.id ? 'Approving…' : 'Approve payment'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reviewingId === payment.id}
                    onClick={() => handleReview(payment.id, 'rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent decisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-slate-600">No reviewed payments yet.</p>
          ) : (
            history.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {payerLabel(payment)} — {Number(payment.amount).toLocaleString()} RWF
                    </p>
                    {payment.course_enrollment_id ? (
                      <p className="text-xs text-slate-500">Linked course enrollment</p>
                    ) : null}
                  </div>
                  {statusBadge(payment.status)}
                </div>

                {(payment.status === 'approved' || payment.status === 'Paid') && (
                  <div className="flex flex-wrap gap-2">
                    {payment.receipt_url ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View receipt
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-900 hover:bg-amber-50"
                      onClick={() =>
                        setRefundTarget({
                          id: payment.id,
                          payerLabel: payerLabel(payment),
                          mode: 'refund',
                        })
                      }
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Refund &amp; revoke access
                    </Button>
                  </div>
                )}

                {payment.status === 'refunded' && payment.receipt_url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View archived receipt
                    </a>
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={refundTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRefundTarget(null)
            setRefundNotes('')
            setDeleteReceiptOnRefund(true)
          }
        }}
      >
        <AlertDialogContent className="admin-form-dialog border-slate-400 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {refundTarget?.mode === 'refund'
                ? 'Refund payment and revoke access?'
                : 'Remove receipt file?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600">
                {refundTarget?.mode === 'refund' ? (
                  <>
                    <p>
                      This marks the payment as <strong>refunded</strong> for{' '}
                      <strong>{refundTarget.payerLabel}</strong>, immediately revokes their course
                      enrollment access, and lets them enroll again later if needed.
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="delete-receipt"
                        checked={deleteReceiptOnRefund}
                        onCheckedChange={(checked) =>
                          setDeleteReceiptOnRefund(checked === true)
                        }
                      />
                      <Label htmlFor="delete-receipt" className="font-normal cursor-pointer">
                        Delete receipt file from storage
                      </Label>
                    </div>
                  </>
                ) : (
                  <p>
                    Removes the uploaded receipt for <strong>{refundTarget?.payerLabel}</strong>{' '}
                    from storage. The payment record stays pending until you approve or reject.
                  </p>
                )}
                <div>
                  <Label htmlFor="refund-notes">Reason / admin notes</Label>
                  <Input
                    id="refund-notes"
                    placeholder="e.g. MoMo refund issued 28 Jun 2026"
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
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
                handleRefundConfirm()
              }}
              className={
                refundTarget?.mode === 'refund'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : undefined
              }
            >
              {actionLoading
                ? 'Processing…'
                : refundTarget?.mode === 'refund'
                  ? 'Confirm refund'
                  : 'Remove receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
