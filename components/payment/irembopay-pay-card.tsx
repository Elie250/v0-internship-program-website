'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type IremboPayStatus = {
  enabled: boolean
  publicKey: string | null
  environment: string
}

type IremboPayPayCardProps = {
  courseId: string
  courseTitle: string
  amount: number
  currency: string
  applicantPhone: string
  motivation?: string
  disabled?: boolean
  onFallback?: () => void
}

export function IremboPayPayCard({
  courseId,
  courseTitle,
  amount,
  currency,
  applicantPhone,
  motivation,
  disabled,
  onFallback,
}: IremboPayPayCardProps) {
  const [status, setStatus] = useState<IremboPayStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/payments/irembopay/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, publicKey: null, environment: 'sandbox' }))
  }, [])

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/irembopay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, applicantPhone, motivation: motivation ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not start payment')
      }

      if (data.paymentLinkUrl) {
        window.location.href = data.paymentLinkUrl
        return
      }

      throw new Error('No payment link returned from IremboPay')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed')
      setLoading(false)
    }
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!status.enabled) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Online payment unavailable</CardTitle>
          <CardDescription>
            IremboPay is not configured yet. Use manual MoMo payment below or contact support.
          </CardDescription>
        </CardHeader>
        {onFallback && (
          <CardContent>
            <Button type="button" variant="outline" onClick={onFallback}>
              Use manual MoMo instead
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5" />
          Pay with IremboPay
        </CardTitle>
        <CardDescription>
          MTN MoMo, Airtel Money, and international cards — instant enrollment after payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
          <div>
            <p className="font-medium">{courseTitle}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5" />
              Rwanda &amp; international methods
            </p>
          </div>
          <p className="text-lg font-semibold">
            {currency} {amount.toLocaleString()}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={disabled || loading}
          onClick={handlePay}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting to IremboPay…
            </>
          ) : (
            <>Pay {currency} {amount.toLocaleString()} now</>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Secured by IremboPay. You will be redirected to complete payment.
        </p>
      </CardContent>
    </Card>
  )
}
