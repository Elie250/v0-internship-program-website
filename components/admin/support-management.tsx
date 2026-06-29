'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AdminSupportTicket } from '@/lib/admin/data/support-tickets'

const TICKET_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
]

function statusColor(status: string) {
  if (status === 'resolved' || status === 'closed') return 'bg-green-100 text-green-700'
  if (status === 'in_progress' || status === 'assigned') return 'bg-blue-100 text-blue-700'
  if (status === 'waiting_customer') return 'bg-amber-100 text-amber-800'
  return 'bg-yellow-100 text-yellow-800'
}

export default function SupportManagement() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [responses, setResponses] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/admin/support-tickets', { credentials: 'same-origin' }),
        fetch('/api/admin/support-subscriptions', { credentials: 'same-origin' }),
      ])
      const ticketsData = await tRes.json()
      const subsData = await sRes.json()
      if (!tRes.ok) throw new Error(ticketsData.error)
      setTickets(Array.isArray(ticketsData) ? ticketsData : [])
      setSubscriptions(Array.isArray(subsData) ? subsData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateTicket = async (id: string, patch: Record<string, string>) => {
    const res = await fetch('/api/admin/support-tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, ...patch }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Update failed')
      return
    }
    load()
  }

  const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes(t.status))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Engineering support</h1>
        <p className="text-slate-600 mt-1">
          Review tickets from subscribed engineers. Approve subscription payments under{' '}
          <strong>Engineer subscriptions</strong>.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">Tickets ({openTickets.length} open)</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions ({subscriptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4 mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : tickets.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No support tickets yet.</CardContent></Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-slate-900">{ticket.title}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        {ticket.requester_name ?? 'Unknown'} · {ticket.requester_email}
                        {ticket.requester_phone ? ` · ${ticket.requester_phone}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.priority ? (
                        <Badge variant="outline">{ticket.priority}</Badge>
                      ) : null}
                      <Badge className={statusColor(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                  <p className="text-xs text-slate-500">
                    {ticket.category?.name ?? 'Uncategorized'} · {new Date(ticket.created_at).toLocaleString()}
                  </p>

                  {ticket.admin_response ? (
                    <div className="rounded bg-blue-50 p-3 text-slate-800">
                      <p className="text-xs font-semibold text-blue-800">Your response</p>
                      <p>{ticket.admin_response}</p>
                    </div>
                  ) : null}

                  <div>
                    <Label>Engineer / admin response</Label>
                    <Textarea
                      rows={3}
                      value={responses[ticket.id] ?? ticket.admin_response ?? ''}
                      onChange={(e) =>
                        setResponses((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      className="mt-1"
                      placeholder="Technical guidance, next steps, or questions for the customer…"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => updateTicket(ticket.id, { status: v })}
                      >
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TICKET_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateTicket(ticket.id, {
                          admin_response: responses[ticket.id] ?? ticket.admin_response ?? '',
                          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
                        })
                      }
                    >
                      Save response
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-800"
                      onClick={() =>
                        updateTicket(ticket.id, {
                          admin_response: responses[ticket.id] ?? ticket.admin_response ?? '',
                          status: 'resolved',
                        })
                      }
                    >
                      Mark resolved
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-3 mt-4">
          {subscriptions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No subscriptions yet.</CardContent></Card>
          ) : (
            subscriptions.map((sub) => {
              const user = sub.user as { email?: string; first_name?: string; last_name?: string; role?: string } | null
              const plan = sub.plan as { name?: string; price?: number; max_tickets?: number } | null
              const name = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : 'User'
              return (
                <Card key={sub.id}>
                  <CardContent className="py-4 flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{name} · {user?.email}</p>
                      <p className="text-sm text-slate-600">
                        {plan?.name ?? 'Plan'} · {Number(plan?.price ?? 0).toLocaleString()} RWF ·{' '}
                        {sub.tickets_used ?? 0}/{plan?.max_tickets ?? '∞'} tickets used
                      </p>
                      {sub.starts_at || sub.ends_at ? (
                        <p className="text-xs text-slate-500 mt-1">
                          {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : '—'} →{' '}
                          {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : '—'}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline">{String(sub.status).replace(/_/g, ' ')}</Badge>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
