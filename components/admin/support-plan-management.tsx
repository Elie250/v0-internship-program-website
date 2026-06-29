'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import type { SupportSubscriptionPlan } from '@/lib/support/types'

type PlanForm = {
  name: string
  slug: string
  description: string
  price: number
  duration_days: number
  max_tickets: number | null
  response_sla_hours: number | null
  plan_tier: 'free' | 'paid'
  max_ai_messages: number | null
  community_can_post: boolean
  community_can_reply: boolean
  featuresText: string
  sort_order: number
  status: SupportSubscriptionPlan['status']
}

const emptyPlan = (): PlanForm => ({
  name: '',
  slug: '',
  description: '',
  price: 0,
  duration_days: 30,
  max_tickets: 5,
  response_sla_hours: 48,
  plan_tier: 'paid',
  max_ai_messages: 30,
  community_can_post: true,
  community_can_reply: true,
  featuresText: '',
  sort_order: 0,
  status: 'published',
})

export default function SupportPlanManagement() {
  const [plans, setPlans] = useState<SupportSubscriptionPlan[]>([])
  const [form, setForm] = useState<PlanForm>(emptyPlan())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/support-plans', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlans(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setError('')
    const features = form.featuresText
      ? form.featuresText.split('\n').map((l) => l.trim()).filter(Boolean)
      : []

    const res = await fetch('/api/admin/support-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: editingId ?? undefined,
        name: form.name,
        slug: form.slug || form.name?.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        price: Number(form.price),
        duration_days: Number(form.duration_days),
        max_tickets: form.max_tickets === null ? null : Number(form.max_tickets),
        response_sla_hours: form.response_sla_hours != null ? Number(form.response_sla_hours) : null,
        plan_tier: form.plan_tier,
        max_ai_messages: form.max_ai_messages === null ? null : Number(form.max_ai_messages),
        community_can_post: form.community_can_post,
        community_can_reply: form.community_can_reply,
        features,
        sort_order: Number(form.sort_order ?? 0),
        status: form.status ?? 'published',
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Save failed')
      return
    }
    setForm(emptyPlan())
    setEditingId(null)
    load()
  }

  const edit = (plan: SupportSubscriptionPlan) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      price: plan.price,
      duration_days: plan.duration_days,
      max_tickets: plan.max_tickets,
      response_sla_hours: plan.response_sla_hours,
      plan_tier: plan.plan_tier,
      max_ai_messages: plan.max_ai_messages,
      community_can_post: plan.community_can_post,
      community_can_reply: plan.community_can_reply,
      featuresText: plan.features.join('\n'),
      sort_order: plan.sort_order,
      status: plan.status,
    })
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this support plan?')) return
    await fetch(`/api/admin/support-plans?id=${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Engineering support plans</h1>
        <p className="text-slate-600 mt-1">
          Configure subscription pricing, duration, ticket limits, SLA, and features. Users pay via MoMo
          and submit receipts — approval activates their plan.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit plan' : 'Create plan'}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Price (RWF)</Label>
            <Input type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <Label>Duration (days)</Label>
            <Input type="number" value={form.duration_days ?? 30} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <Label>Plan tier</Label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={form.plan_tier}
              onChange={(e) => setForm({ ...form, plan_tier: e.target.value as 'free' | 'paid' })}
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <Label>Max AI messages (blank = unlimited)</Label>
            <Input
              type="number"
              value={form.max_ai_messages ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_ai_messages: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.community_can_post}
                onChange={(e) => setForm({ ...form, community_can_post: e.target.checked })}
              />
              Community: can start discussions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.community_can_reply}
                onChange={(e) => setForm({ ...form, community_can_reply: e.target.checked })}
              />
              Community: can reply
            </label>
          </div>
          <div>
            <Label>Max tickets (blank = unlimited)</Label>
            <Input
              type="number"
              value={form.max_tickets ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_tickets: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>Response SLA (hours)</Label>
            <Input type="number" value={form.response_sla_hours ?? ''} onChange={(e) => setForm({ ...form, response_sla_hours: Number(e.target.value) })} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="md:col-span-2">
            <Label>Features (one per line)</Label>
            <Textarea value={form.featuresText ?? ''} onChange={(e) => setForm({ ...form, featuresText: e.target.value })} className="mt-1" rows={4} />
          </div>
          <div>
            <Label>Status</Label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={form.status ?? 'published'}
              onChange={(e) => setForm({ ...form, status: e.target.value as SupportSubscriptionPlan['status'] })}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={save} className="bg-[var(--brand-navy)]">
              {editingId ? 'Update plan' : 'Create plan'}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyPlan()) }}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="text-muted-foreground">No plans yet.</p>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-lg text-slate-900">{plan.name}</CardTitle>
                  <p className="text-sm text-slate-600">
                    {Number(plan.price).toLocaleString()} RWF · {plan.duration_days} days ·{' '}
                    {plan.max_tickets ?? '∞'} tickets · {plan.max_ai_messages ?? '∞'} AI msgs ·{' '}
                    {plan.plan_tier} tier
                  </p>
                </div>
                <Badge variant="outline">{plan.status}</Badge>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(plan)}>
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(plan.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
