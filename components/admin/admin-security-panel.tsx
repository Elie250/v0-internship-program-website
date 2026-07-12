'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'

export default function AdminSecurityPanel() {
  const [enabled, setEnabled] = useState(false)
  const [secret, setSecret] = useState('')
  const [otpUri, setOtpUri] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/admin/security/2fa')
    const data = await res.json()
    setEnabled(Boolean(data.enabled))
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const startSetup = async () => {
    setError('')
    setMessage('')
    const res = await fetch('/api/admin/security/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'setup' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Setup failed')
      return
    }
    setSecret(data.secret)
    setOtpUri(data.otpUri)
    setMessage('Scan the secret into Google Authenticator or Authy, then enter a code to confirm.')
  }

  const confirmSetup = async () => {
    setError('')
    const res = await fetch('/api/admin/security/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'confirm', code, secret }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Invalid code')
      return
    }
    setEnabled(true)
    setSecret('')
    setOtpUri('')
    setCode('')
    setMessage('Two-factor authentication is now enabled for your admin account.')
  }

  const disable = async () => {
    setError('')
    const res = await fetch('/api/admin/security/2fa', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not disable 2FA')
      return
    }
    setEnabled(false)
    setCode('')
    setMessage('Two-factor authentication disabled.')
  }

  if (loading) return <p className="text-slate-600">Loading security settings…</p>

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Security"
        description="Protect administrator sign-in with an authenticator app (TOTP)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <p className="text-sm text-slate-600">
            Status:{' '}
            <strong className={enabled ? 'text-green-700' : 'text-amber-700'}>
              {enabled ? 'Enabled' : 'Not enabled'}
            </strong>
          </p>

          {!enabled && !secret ? (
            <Button type="button" onClick={() => void startSetup()}>
              Set up authenticator
            </Button>
          ) : null}

          {secret ? (
            <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Setup key</p>
              <p className="font-mono text-sm break-all">{secret}</p>
              {otpUri ? (
                <p className="text-xs text-slate-600 break-all">URI: {otpUri}</p>
              ) : null}
              <div className="space-y-2">
                <Label>6-digit code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} />
              </div>
              <Button type="button" onClick={() => void confirmSetup()}>
                Confirm and enable
              </Button>
            </div>
          ) : null}

          {enabled ? (
            <div className="space-y-2">
              <Label>Enter current code to disable</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} />
              <Button type="button" variant="outline" onClick={() => void disable()}>
                Disable 2FA
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
