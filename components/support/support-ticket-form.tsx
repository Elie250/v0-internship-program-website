'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SupportAccessSummary } from '@/lib/support/types'

interface Category {
  id: string
  name: string
}

export function SupportAccessBanner({ access }: { access: SupportAccessSummary | null }) {
  if (!access) return null

  if (access.hasActiveSubscription && access.subscription?.plan) {
    const sub = access.subscription
    const plan = sub.plan!
    return (
      <Card className="border-green-200 bg-green-50/60">
        <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              {plan.name} — {access.planTier === 'paid' ? 'Paid' : 'Free'}
            </p>
            <p className="text-sm text-slate-600">
              {sub.ends_at ? `Valid until ${new Date(sub.ends_at).toLocaleDateString()}` : 'Active'}
              {access.ticketsRemaining != null && access.ticketsRemaining > 0
                ? ` · ${access.ticketsRemaining} ticket${access.ticketsRemaining === 1 ? '' : 's'} left`
                : access.planTier === 'paid' && access.ticketsRemaining === 0
                  ? ' · No tickets remaining'
                  : ''}
              {access.aiMessagesRemaining != null
                ? ` · ${access.aiMessagesRemaining} AI messages left`
                : access.canUseAiAssistant
                  ? ' · Unlimited AI'
                  : ''}
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800">Subscribed</Badge>
        </CardContent>
      </Card>
    )
  }

  if (access.subscription?.status === 'payment_pending_review') {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="py-4">
          <p className="font-semibold text-slate-900">Payment under review</p>
          <p className="text-sm text-slate-600">{access.blockReason}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="py-4">
        <p className="text-sm text-slate-700">{access.blockReason}</p>
      </CardContent>
    </Card>
  )
}

export function SupportTicketForm({
  categories,
  access,
}: {
  categories: Category[]
  access: SupportAccessSummary | null
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'normal',
    requester_phone: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const canSubmit = access?.canSubmitTicket ?? false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('loading')
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit ticket')
      setStatus('success')
      setMessage('Support ticket submitted. Our engineers will respond soon.')
      setForm({ title: '', description: '', category_id: '', priority: 'normal', requester_phone: '' })
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Submit help request</CardTitle>
      </CardHeader>
      <CardContent>
        {!canSubmit ? (
          <p className="text-sm text-slate-600 mb-4">
            {access?.blockReason ?? 'Subscribe to a support plan to submit tickets.'}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">What do you need help with?</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={!canSubmit}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
                disabled={!canSubmit}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
                disabled={!canSubmit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Describe the issue in detail</Label>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              disabled={!canSubmit}
              placeholder="Equipment, error codes, wiring diagrams, PLC program, etc."
            />
          </div>
          <Button type="submit" disabled={!canSubmit || status === 'loading'} className="bg-[var(--brand-navy)]">
            {status === 'loading' ? 'Submitting…' : 'Submit ticket'}
          </Button>
          {message ? (
            <p className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-destructive'}`}>{message}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}

export function MySupportTickets() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/support-tickets', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-600">Loading your tickets…</p>
  if (tickets.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Your tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-medium text-slate-900">{ticket.title}</p>
              <Badge variant="outline">{ticket.status.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-slate-600 mt-1">{ticket.description}</p>
            {ticket.admin_response ? (
              <div className="mt-2 rounded bg-blue-50 p-2 text-slate-800">
                <p className="text-xs font-semibold uppercase text-blue-800">Engineer response</p>
                <p>{ticket.admin_response}</p>
              </div>
            ) : null}
            <p className="text-xs text-slate-500 mt-2">
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
