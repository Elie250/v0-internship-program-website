'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Application {
  id: string
  name: string
  email: string
  phone: string
  status: string
  role: string
  created_at: string
}

export default function ApplicationsPage() {

  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [filtered, setFiltered] = useState<Application[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const auth = localStorage.getItem('admin_authenticated')

    if (!auth) {
      router.push('/admin/login')
      return
    }

    fetchApplications()

  }, [])

  const fetchApplications = async () => {

    try {

      const res = await fetch('/api/admin-dashboard', {
        headers: {
          Authorization: `Bearer admin_token`
        }
      })

      const data = await res.json()

      if (data.success) {

        setApplications(data.data)
        setFiltered(data.data)

      }

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {

    const term = search.toLowerCase()

    const result = applications.filter(app =>
      app.name?.toLowerCase().includes(term) ||
      app.email?.toLowerCase().includes(term)
    )

    setFiltered(result)

  }, [search])

  const updateStatus = async (id: string, status: string) => {

    const res = await fetch('/api/admin-dashboard', {

      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer admin_token`
      },

      body: JSON.stringify({
        id,
        status
      })

    })

    const data = await res.json()

    if (data.success) {

      setApplications(prev =>
        prev.map(a =>
          a.id === id ? { ...a, status } : a
        )
      )

    }

  }

  const statusColor = (status: string) => {

    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'

    return 'bg-yellow-100 text-yellow-700'

  }

  if (loading) {

    return <p className="text-center mt-10">Loading applications...</p>

  }

  return (

    <main className="space-y-6">

      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold">
          Applications Office
        </h1>

        <Input
          placeholder="Search applicant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />

      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr className="text-left">

              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {filtered.map(app => (

              <tr key={app.id} className="border-b">

                <td className="p-3 font-medium">
                  {app.name}
                </td>

                <td>{app.email}</td>

                <td>{app.phone}</td>

                <td>

                  <Badge className={statusColor(app.status)}>
                    {app.status}
                  </Badge>

                </td>

                <td>
                  {new Date(app.created_at).toLocaleDateString()}
                </td>

                <td className="flex gap-2 py-2">

                  <Button
                    size="sm"
                    onClick={() => updateStatus(app.id, 'approved')}
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(app.id, 'rejected')}
                  >
                    Reject
                  </Button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>

  )

}