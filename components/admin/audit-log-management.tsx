'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'

type AuditRow = {
  id: string
  actorEmail: string | null
  actorRole: string | null
  action: string
  module: string
  summary: string
  createdAt: string
}

export default function AuditLogManagement() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/audit-log')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="text-slate-600">Loading audit log…</p>

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Audit log"
        description="Track who changed payments, users, library content, and other admin actions."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-600">
              No audit entries yet. Run scripts/57-admin-audit-log.sql in Supabase if this module is new.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => (
                <li key={row.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row.summary}</p>
                    <time className="text-xs text-slate-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {row.module} · {row.action}
                    {row.actorEmail ? ` · ${row.actorEmail}` : ''}
                    {row.actorRole ? ` (${row.actorRole})` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
