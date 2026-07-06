'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type StudentRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  status: string
  createdAt: string
  enrollments: Array<{
    enrollmentId: string
    courseTitle: string
    status: string
    amountDue: number
    enrolledAt: string
    admittedAt: string | null
  }>
  activeEnrollments: number
  pendingEnrollments: number
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending_approval: 'bg-amber-100 text-amber-900',
    inactive: 'bg-slate-200 text-slate-700',
    suspended: 'bg-red-100 text-red-800',
    admitted: 'bg-green-100 text-green-800',
    payment_pending_review: 'bg-amber-100 text-amber-900',
    payment_rejected: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-slate-100 text-slate-800'
}

function exportCsv(students: StudentRow[]) {
  const rows: string[][] = [
    ['Name', 'Email', 'Phone', 'Account status', 'Role', 'Active enrollments', 'Pending', 'Programmes'],
  ]
  for (const s of students) {
    const programmes = s.enrollments
      .map((e) => `${e.courseTitle} (${e.status})`)
      .join('; ')
    rows.push([
      s.fullName,
      s.email,
      s.phone ?? '',
      s.status,
      s.role,
      String(s.activeEnrollments),
      String(s.pendingEnrollments),
      programmes,
    ])
  }
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'students-registry.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function StudentsRegistryPanel() {
  const [students, setStudents] = useState<StudentRow[]>([])
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
      const res = await fetch(`/api/admin/students${params}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load students')
      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students')
      setStudents([])
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
          All student accounts with contact details and programme enrollments.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 text-slate-900"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-slate-800"
            onClick={() => exportCsv(students)}
            disabled={!students.length}
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading students…</p>
      ) : students.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-8 text-center text-slate-600">No students found.</CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Account</th>
                <th className="py-3 px-4 font-semibold">Enrollments</th>
                <th className="py-3 px-4 font-semibold">Programmes</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{s.fullName}</p>
                    <p className="text-xs text-slate-600">{s.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Joined {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{s.phone ?? '—'}</td>
                  <td className="py-3 px-4">
                    <Badge className={statusClass(s.status)}>{s.status}</Badge>
                    <p className="text-xs text-slate-500 mt-1">{s.role}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-medium text-green-700">{s.activeEnrollments}</span> active
                    {s.pendingEnrollments > 0 ? (
                      <span className="text-amber-700"> · {s.pendingEnrollments} pending</span>
                    ) : null}
                  </td>
                  <td className="py-3 px-4">
                    {s.enrollments.length === 0 ? (
                      <span className="text-slate-500">None</span>
                    ) : (
                      <ul className="space-y-1">
                        {s.enrollments.map((e) => (
                          <li key={e.enrollmentId} className="text-xs">
                            <span className="text-slate-900 font-medium">{e.courseTitle}</span>
                            <Badge className={`ml-1.5 ${statusClass(e.status)}`}>{e.status}</Badge>
                            {e.amountDue > 0 ? (
                              <span className="text-slate-500 ml-1">
                                · {e.amountDue.toLocaleString()} RWF
                              </span>
                            ) : (
                              <span className="text-slate-500 ml-1">· Free</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
