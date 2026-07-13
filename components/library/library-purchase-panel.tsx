'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MomoPayCard } from '@/components/payment/momo-pay-card'
import { CheckCircle2, Loader2, Lock } from 'lucide-react'
import type { EnergyLibraryItem } from '@/lib/library/items'
import type { LibraryPurchaseStatus } from '@/lib/library/access'

type PurchaseUser = {
  firstName?: string
  lastName?: string
  email: string
  phone?: string | null
}

export function LibraryPurchasePanel({
  item,
  user,
  purchaseStatus,
}: {
  item: EnergyLibraryItem
  user: PurchaseUser | null
  purchaseStatus?: LibraryPurchaseStatus
}) {
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [payerPhone, setPayerPhone] = useState(user?.phone ?? '')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const price = Number(item.price_rwf ?? 0)

  const handleReceiptUpload = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/public/upload-receipt', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.hint ? `${data.error} — ${data.hint}` : data.error)
      setReceiptUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/library/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: item.slug,
          receiptUrl,
          receiptNumber,
          payerPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSuccess(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success || purchaseStatus === 'pending_payment') {
    return (
      <Card className="border-blue-200 shadow-sm">
        <CardContent className="pt-8 pb-8 space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <CheckCircle2 className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment pending review</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {success ||
                'We received your MoMo receipt. Full access unlocks after our team verifies payment (usually within one business day).'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Paid access — {price.toLocaleString()} RWF
          </CardTitle>
          <CardDescription>
            Sign in to purchase and unlock the full {item.pillar === 'books' ? 'book' : 'culture piece'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-[var(--brand-navy)]">
            <Link href={`/auth/login?redirect=/library/${item.slug}`}>Log in to purchase</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5" />
          Unlock full access — {price.toLocaleString()} RWF
        </CardTitle>
        <CardDescription>
          Pay with MTN MoMo, upload your receipt, and our team will verify within one business day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MomoPayCard amountLabel={`Amount due — ${item.title}: ${price.toLocaleString()} RWF`} />

        <div className="space-y-2">
          <Label htmlFor="library-phone">Phone (MoMo number)</Label>
          <Input
            id="library-phone"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            placeholder="07xxxxxxxx"
          />
        </div>

        <div className="space-y-2">
          <Label>Payment receipt</Label>
          <Input
            type="file"
            accept="image/*,application/pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleReceiptUpload(file)
            }}
          />
          {receiptUrl ? (
            <p className="text-sm text-green-700">Receipt uploaded. You can submit when ready.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="library-receipt-number">Receipt / transaction ID (optional)</Label>
          <Input
            id="library-receipt-number"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button
          className="w-full bg-[var(--brand-navy)]"
          disabled={submitting || uploading || !receiptUrl || !payerPhone.trim()}
          onClick={() => void handleSubmit()}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            'Submit payment for review'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
