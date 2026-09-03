'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function ShopLogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const t = useShopT()

  async function onLogout() {
    setBusy(true)
    try {
      await fetch('/api/staff/auth', {
        method: 'DELETE',
        credentials: 'same-origin',
      })
    } finally {
      router.replace('/login')
      router.refresh()
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onLogout} disabled={busy}>
      {busy ? t('action.signingOut') : t('action.signOut')}
    </Button>
  )
}
