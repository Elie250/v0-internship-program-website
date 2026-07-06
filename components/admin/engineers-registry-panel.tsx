'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import { adminStatusClass } from '@/components/admin/admin-section-header'

type EngineerRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  status: string
  createdAt: string
  subscriptions: Array<{
    subscriptionId: string
    planName: string
    status: string
    expiresAt: string | null
    createdAt: string
  }>
  activeSubscription: boolean
  openTickets: number
}

function exportCsv(rows: EngineerRow[]) {
  const lines: string[][] = [
    ['Name', 'Email', 'Phone', 'Status', 'Active plan', 'Open tickets', 'Subscriptions'],
  ]
  for (const row of rows) {
    lines.push([
      row.fullName,
      row.email,
      row.phone ?? '',
      row.status,
      row.activeSubscription ? 'Yes' : 'No',
      String(row.openTickets),
      row.subscriptions.map((s) => `${s.planName} (${s.status})`).join('; '),
    ])
  }
  const csv = lines.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'engineers-registry.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function EngineersRegistryPanel() {
  const [rows, setRows] = useState<EngineerRow[]>([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = debounced ? `?search=${encodeURIComponent(debounced)}` : ''
      const res = await fetch(`/api/admin/engineers${params}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load engineers')
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engineers')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [debounced])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {rows.length} engineer{rows.length === 1 ? '' : 's'} · subscription payments in{' '}
          <Link
            href="/admin/dashboard/engineer-subscriptions"
            className="text-[var(--brand-navy)] underline-offset-2 hover:underline"
          >
            Engineer subscriptions
          </Link>
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:w-56 text-slate-900 bg-white"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-slate-800 border-slate-300 bg-white shrink-0"
            onClick={() => exportCsv(rows)}
            disabled={!rows.length}
          >
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading engineers…</p>
      ) : rows.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-10 text-center text-slate-600">No engineers found.</CardContent>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {rows.map((row) => (
              <Card key={row.id} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{row.fullName}</p>
                      <p className="text-xs text-slate-600 break-all">{row.email}</p>
                    </div>
                    <Badge variant="outline" className={adminStatusClass(row.status)}>
                      {row.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={
                        row.activeSubscription
                          ? adminStatusClass('active')
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }
                    >
                      {row.activeSubscription ? 'Active plan' : 'No active plan'}
                    </Badge>
                    {row.openTickets > 0 ? (
                      <Badge variant="outline" className={adminStatusClass('payment_pending_review')}>
                        {row.openTickets} open ticket{row.openTickets === 1 ? '' : 's'}
                      </Badge>
                    ) : null}
                  </div>
                  {row.subscriptions.length > 0 ? (
                    <ul className="text-xs space-y-1 text-slate-700">
                      {row.subscriptions.slice(0, 3).map((s) => (
                        <li key={s.subscriptionId}>
                          {s.planName}{' '}
                          <Badge variant="outline" className={`ml-1 ${adminStatusClass(s.status)}`}>
                            {s.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No subscription history</p>
                  )}
                  <Button asChild size="sm" variant="outline" className="w-full border-slate-300 text-slate-800">
                    <Link href={`/admin/dashboard/users?search=${encodeURIComponent(row.email)}`}>
                      Manage account <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-800">
                  <th className="py-3 px-4 font-semibold">Engineer</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Account</th>
                  <th className="py-3 px-4 font-semibold">Support plan</th>
                  <th className="py-3 px-4 font-semibold">Tickets</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{row.fullName}</p>
                      <p className="text-xs text-slate-600">{row.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{row.phone ?? '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={adminStatusClass(row.status)}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {row.subscriptions.length === 0 ? (
                        <span className="text-slate-500">None</span>
                      ) : (
                        <ul className="space-y-1">
                          {row.subscriptions.slice(0, 2).map((s) => (
                            <li key={s.subscriptionId} className="text-xs text-slate-700">
                              {s.planName}{' '}
                              <Badge variant="outline" className={`ml-1 ${adminStatusClass(s.status)}`}>
                                {s.status}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {row.openTickets > 0 ? (
                        <Link
                          href="/admin/dashboard/support"
                          className="text-amber-800 font-medium hover:underline"
                        >
                          {row.openTickets} open
                        </Link>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-800">
                        <Link href={`/admin/dashboard/users?search=${encodeURIComponent(row.email)}`}>
                          Account
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
