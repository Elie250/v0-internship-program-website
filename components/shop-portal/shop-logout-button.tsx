'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ShopLogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

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
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
