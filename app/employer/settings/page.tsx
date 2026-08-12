'use client'

import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'

export default function EmployerSettingsPage() {
  const { orgId, canSettings, canWriteJobs } = useEmployerOrg()
  const [form, setForm] = useState({
    name: '',
    description: '',
    careersBlurb: '',
    notificationEmail: '',
  })
  const [credentials, setCredentials] = useState<
    Array<{ id: string; name: string; keyId: string; status: string; scopes: string[] }>
  >([])
  const [webhooks, setWebhooks] = useState<
    Array<{ id: string; name: string; targetUrl: string; status: string }>
  >([])
  const [credName, setCredName] = useState('Integration')
  const [webhookName, setWebhookName] = useState('HR system')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [oneTimeSecret, setOneTimeSecret] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadOrg = async () => {
    if (!orgId) return
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
  }

  const loadIntegration = async () => {
    if (!orgId || !canWriteJobs) return
    const [cRes, wRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/api-credentials`, { credentials: 'same-origin' }),
      fetch(`/api/recruitment/organizations/${orgId}/webhooks`, { credentials: 'same-origin' }),
    ])
    if (cRes.ok) {
      const body = await cRes.json()
      setCredentials(body.credentials ?? [])
    }
    if (wRes.ok) {
      const body = await wRes.json()
      setWebhooks(body.webhooks ?? [])
    }
  }

  useEffect(() => {
    void loadOrg()
    void loadIntegration()
  }, [orgId, canWriteJobs])

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

  const createCredential = async () => {
    setError('')
    setOneTimeSecret('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/api-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        name: credName,
        scopes: [
          'jobs:read',
          'applications:read',
          'candidates:read',
          'screening:read',
          'interviews:read',
        ],
        accessMode: 'organization',
      }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not create credential')
    else {
      setOneTimeSecret(data.authorizationHint || `${data.credential?.keyId}:${data.secret}`)
      setMessage('API credential created. Copy the secret now — it will not be shown again.')
      await loadIntegration()
    }
  }

  const revokeCredential = async (credentialId: string) => {
    const res = await fetch(`/api/recruitment/organizations/${orgId}/api-credentials`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ credentialId, action: 'revoke' }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Revoke failed')
    } else await loadIntegration()
  }

  const createWebhook = async () => {
    setError('')
    setOneTimeSecret('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        name: webhookName,
        targetUrl: webhookUrl,
        events: [
          'application.created',
          'application.status_changed',
          'screening.completed',
          'interview.created',
          'interview.updated',
          'interview.completed',
          'candidate.hired',
        ],
      }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not create webhook')
    else {
      setOneTimeSecret(data.signingSecret || '')
      setMessage('Webhook created. Copy the signing secret now.')
      await loadIntegration()
    }
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Organization settings</h1>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      {oneTimeSecret ? (
        <StatusBanner tone="info">
          One-time secret (copy now): <code className="break-all">{oneTimeSecret}</code>
        </StatusBanner>
      ) : null}

      {!canSettings ? (
        <p className="text-sm text-slate-600">Only organization admins can change organization profile settings.</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Careers blurb</Label>
            <Textarea
              value={form.careersBlurb}
              onChange={(e) => setForm((f) => ({ ...f, careersBlurb: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Notification email</Label>
            <Input
              value={form.notificationEmail}
              onChange={(e) => setForm((f) => ({ ...f, notificationEmail: e.target.value }))}
            />
          </div>
          <Button onClick={() => void save()} className="bg-[var(--brand-navy)] text-white">
            Save settings
          </Button>
        </div>
      )}

      {canWriteJobs ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-2xl">
          <div>
            <h2 className="font-semibold">API credentials</h2>
            <p className="text-xs text-slate-500 mt-1">
              External HR integrations use Bearer credentials. Secrets are hashed and shown once.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              value={credName}
              onChange={(e) => setCredName(e.target.value)}
              className="max-w-xs"
              placeholder="Credential name"
            />
            <Button onClick={() => void createCredential()} className="bg-[var(--brand-navy)] text-white">
              Create credential
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {credentials.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <span>
                  {c.name} · <code>{c.keyId}</code> · {c.status}
                </span>
                {c.status !== 'revoked' ? (
                  <Button variant="outline" size="sm" onClick={() => void revokeCredential(c.id)}>
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canWriteJobs ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-2xl">
          <div>
            <h2 className="font-semibold">Webhooks</h2>
            <p className="text-xs text-slate-500 mt-1">
              HTTPS endpoints receive signed events for application and interview lifecycle changes.
            </p>
          </div>
          <Input
            value={webhookName}
            onChange={(e) => setWebhookName(e.target.value)}
            placeholder="Webhook name"
          />
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/hooks/recruitment"
          />
          <Button onClick={() => void createWebhook()} className="bg-[var(--brand-navy)] text-white">
            Create webhook
          </Button>
          <ul className="space-y-2 text-sm">
            {webhooks.map((w) => (
              <li key={w.id} className="border-t border-slate-100 pt-2">
                {w.name} · {w.status} · <span className="text-slate-500">{w.targetUrl}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            Developer docs: <code>docs/recruitment-external-api.md</code> · OpenAPI JSON via{' '}
            <code>/api/v1/recruitment/openapi</code>
          </p>
        </section>
      ) : null}
    </EmployerShell>
  )
}
