'use client'

import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'

export default function EmployerSettingsPage() {
  const { orgId, canSettings } = useEmployerOrg()
  const [form, setForm] = useState({
    name: '',
    description: '',
    careersBlurb: '',
    notificationEmail: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orgId) return
    void (async () => {
      const res = await fetch(`/api/recruitment/organizations/${orgId}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (res.ok && data.organization) {
        setForm({
          name: data.organization.name ?? '',
          description: data.organization.description ?? '',
          careersBlurb: data.organization.careers_blurb ?? '',
          notificationEmail: data.organization.notification_email ?? '',
        })
      }
    })()
  }, [orgId])

  const save = async () => {
    setError('')
    setMessage('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Save failed')
    else setMessage('Organization settings saved.')
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Organization settings</h1>
      {!canSettings ? (
        <p className="text-sm text-slate-600">Only organization admins can change these settings.</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-2xl">
          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Careers blurb</Label>
            <Textarea value={form.careersBlurb} onChange={(e) => setForm((f) => ({ ...f, careersBlurb: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Notification email</Label>
            <Input value={form.notificationEmail} onChange={(e) => setForm((f) => ({ ...f, notificationEmail: e.target.value }))} />
          </div>
          <Button onClick={() => void save()} className="bg-[var(--brand-navy)] text-white">
            Save settings
          </Button>
        </div>
      )}
    </EmployerShell>
  )
}
