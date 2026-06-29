'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import type { SupportSubscriptionPlan } from '@/lib/support/types'
import { PAYMENT } from '@/lib/company/constants'

export function SupportPlanCards({
  plans,
  onSelect,
  selectedPlanId,
}: {
  plans: SupportSubscriptionPlan[]
  onSelect: (plan: SupportSubscriptionPlan) => void
  selectedPlanId?: string
}) {
  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Support plans will appear once configured by an administrator.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const selected = selectedPlanId === plan.id
        return (
          <Card
            key={plan.id}
            className={`cursor-pointer transition shadow-sm ${selected ? 'ring-2 ring-[var(--brand-navy)]' : 'hover:shadow-md'}`}
            onClick={() => onSelect(plan)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg text-slate-900">{plan.name}</CardTitle>
                {selected ? <Badge className="bg-[var(--brand-navy)]">Selected</Badge> : null}
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {Number(plan.price).toLocaleString()} <span className="text-sm font-normal text-slate-600">RWF</span>
              </p>
              <p className="text-xs text-slate-500">
                {plan.duration_days} days
                {plan.max_tickets != null ? ` · ${plan.max_tickets} tickets` : ' · unlimited tickets'}
                {plan.response_sla_hours ? ` · ${plan.response_sla_hours}h SLA` : ''}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.description ? (
                <p className="text-sm text-slate-600">{plan.description}</p>
              ) : null}
              <ul className="space-y-1.5 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant={selected ? 'default' : 'outline'}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(plan)
                }}
              >
                {selected ? 'Selected' : 'Choose plan'}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function SupportSubscribePanel({
  plan,
  isLoggedIn,
  onSuccess,
}: {
  plan: SupportSubscriptionPlan | null
  isLoggedIn: boolean
  onSuccess?: () => void
}) {
  const [phone, setPhone] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-600">
          Select a support plan above to continue.
        </CardContent>
      </Card>
    )
  }

  if (!isLoggedIn) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-6 space-y-3">
          <p className="text-sm text-slate-800">
            Log in or register as an <strong>Engineer</strong>, <strong>Student</strong>, or{' '}
            <strong>Registered</strong> user to subscribe.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/auth/login?redirect=/engineering-support`}>Log in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/auth/register?redirect=/engineering-support`}>Create account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isFree = Number(plan.price) <= 0

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/public/upload-receipt', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setReceiptUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubscribe = async () => {
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/support/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          planId: plan.id,
          applicantPhone: phone,
          receiptUrl,
          receiptNumber,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Subscription failed')
      setMessage(data.message ?? 'Subscription submitted.')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Subscribe — {plan.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFree ? (
          <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
            <p className="font-medium text-slate-900">{PAYMENT.method}</p>
            <p>
              Pay Code: <strong>{PAYMENT.momoPayCode}</strong> ({PAYMENT.accountName})
            </p>
            <p className="text-slate-600">
              Amount: <strong>{Number(plan.price).toLocaleString()} RWF</strong>
            </p>
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-slate-900">Phone (MoMo)</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+250..."
            required
          />
        </div>

        {!isFree ? (
          <>
            <div>
              <label className="text-sm font-medium text-slate-900">Payment receipt</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 block w-full text-sm"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              {receiptUrl ? (
                <p className="text-xs text-green-700 mt-1">Receipt uploaded ✓</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900">MoMo reference (optional)</label>
              <input
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <Button
          className="w-full bg-[var(--brand-navy)]"
          disabled={submitting || uploading || !phone || (!isFree && !receiptUrl)}
          onClick={handleSubscribe}
        >
          {submitting ? 'Submitting…' : isFree ? 'Activate free plan' : 'Submit receipt for verification'}
        </Button>
      </CardContent>
    </Card>
  )
}
