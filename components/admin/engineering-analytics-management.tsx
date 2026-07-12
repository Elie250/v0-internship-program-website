'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

type AnalyticsRow = {
  id: string
  title: string
  slug: string
  view_count: number
  status: string
}

export default function EngineeringAnalyticsManagement() {
  const [rows, setRows] = useState<AnalyticsRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/admin/engineering-analytics')
      .then((res) => res.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-slate-600">Loading analytics…</p>

  const totalViews = rows.reduce((sum, row) => sum + row.view_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Field Notes analytics</h1>
        <p className="text-slate-600 mt-1">Article views (session-deduplicated per browser).</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total views (top 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">{totalViews.toLocaleString()}</p>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-slate-600">No view data yet. Run scripts/49-engineering-blog-phase3.sql if views stay at zero.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <Card key={row.id}>
              <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-slate-400 w-6">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{row.title}</p>
                    <p className="text-sm text-slate-500">{row.view_count.toLocaleString()} views</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline">{row.status}</Badge>
                  {row.status === 'published' ? (
                    <Link
                      href={`/engineering/${row.slug}`}
                      target="_blank"
                      className="inline-flex items-center text-sm text-[var(--brand-navy)] underline"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
