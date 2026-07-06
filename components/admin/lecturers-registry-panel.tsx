'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import { adminStatusClass } from '@/components/admin/admin-section-header'

type LecturerRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  status: string
  createdAt: string
  assignedCourses: Array<{ courseId: string; title: string; status: string }>
  courseCount: number
}

function exportCsv(rows: LecturerRow[]) {
  const lines: string[][] = [
    ['Name', 'Email', 'Phone', 'Role', 'Status', 'Assigned courses', 'Programmes'],
  ]
  for (const row of rows) {
    lines.push([
      row.fullName,
      row.email,
      row.phone ?? '',
      row.role,
      row.status,
      String(row.courseCount),
      row.assignedCourses.map((c) => `${c.title} (${c.status})`).join('; '),
    ])
  }
  const csv = lines.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'lecturers-registry.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function LecturersRegistryPanel() {
  const [rows, setRows] = useState<LecturerRow[]>([])
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
      const res = await fetch(`/api/admin/lecturers${params}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load lecturers')
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lecturers')
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
          {rows.length} lecturer{rows.length === 1 ? '' : 's'} · classroom delivery at{' '}
          <Link href="/lecturer/dashboard" className="text-[var(--brand-navy)] underline-offset-2 hover:underline">
            /lecturer
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
        <p className="text-sm text-slate-600">Loading lecturers…</p>
      ) : rows.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-10 text-center text-slate-600">No lecturers found.</CardContent>
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
                  <p className="text-sm text-slate-700">{row.phone ?? 'No phone'}</p>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">{row.courseCount}</span> assigned programme
                    {row.courseCount === 1 ? '' : 's'}
                  </p>
                  {row.assignedCourses.length > 0 ? (
                    <ul className="text-xs space-y-1 text-slate-700">
                      {row.assignedCourses.map((c) => (
                        <li key={c.courseId}>
                          {c.title}{' '}
                          <Badge variant="outline" className={`ml-1 ${adminStatusClass(c.status)}`}>
                            {c.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
                  <th className="py-3 px-4 font-semibold">Lecturer</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Account</th>
                  <th className="py-3 px-4 font-semibold">Programmes</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{row.fullName}</p>
                      <p className="text-xs text-slate-600">{row.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Joined {new Date(row.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{row.phone ?? '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={adminStatusClass(row.status)}>
                        {row.status}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{row.role}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 mb-1">{row.courseCount} assigned</p>
                      {row.assignedCourses.length === 0 ? (
                        <span className="text-slate-500 text-xs">None — assign in Courses</span>
                      ) : (
                        <ul className="space-y-1">
                          {row.assignedCourses.map((c) => (
                            <li key={c.courseId} className="text-xs text-slate-700">
                              {c.title}{' '}
                              <Badge variant="outline" className={`ml-1 ${adminStatusClass(c.status)}`}>
                                {c.status}
                              </Badge>
                            </li>
                          ))}
                        </ul>
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
