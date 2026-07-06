'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  transactionId?: string
  invoiceNumber?: string
}

type VerifyState = 'loading' | 'success' | 'pending' | 'error'

export function IremboPayCallbackInner({ transactionId, invoiceNumber }: Props) {
  const [state, setState] = useState<VerifyState>('loading')
  const [message, setMessage] = useState<string>('Verifying your payment…')

  useEffect(() => {
    const params = new URLSearchParams()
    if (transactionId) params.set('transactionId', transactionId)
    if (invoiceNumber) params.set('invoiceNumber', invoiceNumber)

    fetch(`/api/payments/irembopay/verify?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok && data.success) {
          setState('success')
          setMessage(data.message || 'Payment confirmed. Your enrollment is active.')
          return
        }
        if (data.status && data.status !== 'PAID') {
          setState('pending')
          setMessage('Payment received — confirmation is still processing. Check your dashboard in a few minutes.')
          return
        }
        setState('error')
        setMessage(data.error || 'We could not verify this payment.')
      })
      .catch(() => {
        setState('error')
        setMessage('Could not reach the verification service.')
      })
  }, [transactionId, invoiceNumber])

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        {state === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
        {state === 'success' && <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />}
        {state === 'pending' && <Loader2 className="mx-auto h-12 w-12 text-amber-500" />}
        {state === 'error' && <XCircle className="mx-auto h-12 w-12 text-destructive" />}
        <CardTitle>
          {state === 'loading' && 'Verifying payment'}
          {state === 'success' && 'Payment successful'}
          {state === 'pending' && 'Almost there'}
          {state === 'error' && 'Verification issue'}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/student/courses">Go to my courses</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/payment-instructions">Payment help</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
