'use client'

import { useState } from 'react'
import { Registration } from '@/lib/types'
import { downloadExcel } from '@/lib/excel-export'
import { acceptApplication, declineApplication } from './actions'
import { generateCertificate } from '@/lib/certificates-generator'

interface DashboardProps {
  registrations: Registration[]
}

export default function DashboardClient({ registrations }: DashboardProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = registrations.filter(r => {
    const matchesSearch = r.full_name?.toLowerCase().includes(search.toLowerCase())
      || r.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesType = typeFilter === 'all' || r.registration_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleAccept = async (id: string) => { setLoadingId(id); await acceptApplication(id); setLoadingId(null) }
  const handleDecline = async (id: string) => { setLoadingId(id); await declineApplication(id); setLoadingId(null) }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100 space-y-6">
      <div className="flex gap-2 flex-wrap">
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border px-2 py-1 rounded">
          <option value="all">All Status</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border px-2 py-1 rounded">
          <option value="all">All Types</option>
          <option value="Student">Student</option>
          <option value="Individual">Individual</option>
        </select>
        <button onClick={() => downloadExcel({ registrations: filtered })} className="bg-green-600 text-white px-3 py-1 rounded">Download CSV</button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow p-4">
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Type</th><th>Program</th><th>Duration</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.email}</td>
                <td>{r.registration_type}</td>
                <td>{r.program}</td>
                <td>{r.duration}</td>
                <td>{r.status}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="flex gap-2">
                  <button disabled={loadingId === r.id} onClick={() => handleAccept(r.id)} className="bg-green-600 text-white px-2 py-1 rounded">Accept</button>
                  <button disabled={loadingId === r.id} onClick={() => handleDecline(r.id)} className="bg-red-600 text-white px-2 py-1 rounded">Decline</button>
                  <button disabled={r.status !== 'accepted'} onClick={() => generateCertificate(r)} className="bg-blue-600 text-white px-2 py-1 rounded">Certificate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}