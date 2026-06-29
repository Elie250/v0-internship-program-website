'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  listAllPayments,
  listPendingPayments,
  reviewPayment,
  type PaymentRecord,
} from '@/app/actions/admin-payments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react'

export default function PaymentVerificationPanel() {
  const [pending, setPending] = useState<PaymentRecord[]>([])
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [pendingRes, allRes] = await Promise.all([
      listPendingPayments(),
      listAllPayments(),
    ])

    if (!pendingRes.success) {
      setError(pendingRes.error || 'Failed to load pending payments')
    } else {
      setPending(pendingRes.payments ?? [])
    }

    if (allRes.success) {
      const reviewed = (allRes.payments ?? []).filter(
        (p) => p.status === 'approved' || p.status === 'rejected' || p.status === 'Paid'
      )
      setHistory(reviewed.slice(0, 20))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    const result = await reviewPayment({
      id,
      decision,
      adminNotes: notes[id],
    })
    if (!result.success) {
      setError(result.error || 'Review failed')
      return
    }
    load()
  }

  const statusBadge = (status: string) => {
    if (status === 'approved' || status === 'Paid') {
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending review</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Receipt Verification</h1>
        <p className="text-muted-foreground mt-1">
          Manual workflow — users pay offline and upload a receipt. You verify the receipt visually, then approve or reject. No payment gateway.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending review ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments awaiting receipt review.</p>
          ) : (
            pending.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {payment.payer_name || 'Unknown payer'} — {payment.amount?.toLocaleString()} RWF
                    </p>
                    <p className="text-sm text-muted-foreground">{payment.payer_email}</p>
                    {payment.payer_phone && (
                      <p className="text-sm text-muted-foreground">{payment.payer_phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Method: {payment.payment_method || 'N/A'}
                      {payment.receipt_number ? ` · Ref: ${payment.receipt_number}` : ''}
                      {payment.course_enrollment_id ? ' · Course enrollment' : ''}
                    </p>
                  </div>
                  {statusBadge(payment.status)}
                </div>

                {payment.receipt_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View receipt
                    </a>
                  </Button>
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
                    onClick={() => handleReview(payment.id, 'approved')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve payment
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
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
        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviewed payments yet.</p>
          ) : (
            history.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm"
              >
                <span>
                  {payment.payer_name || payment.payer_email} — {payment.amount}
                </span>
                {statusBadge(payment.status)}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
