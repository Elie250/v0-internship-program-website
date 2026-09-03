'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sanitizeShopReturnPath } from '@/lib/shop/safe-return-path'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function ShopLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useShopT()
  const returnTo = useMemo(
    () => sanitizeShopReturnPath(searchParams.get('returnTo')),
    [searchParams]
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // API error strings are English contracts for this phase — show as returned
        setError(
          typeof data.error === 'string' && data.error
            ? data.error
            : t('auth.error.generic')
        )
        return
      }
      router.replace(returnTo)
      router.refresh()
    } catch {
      setError(t('auth.error.retry'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="shop-email">{t('auth.email')}</Label>
        <Input
          id="shop-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shop-password">{t('auth.password')}</Label>
        <Input
          id="shop-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
        disabled={busy}
      >
        {busy ? t('action.signingIn') : t('action.signIn')}
      </Button>
    </form>
  )
}
