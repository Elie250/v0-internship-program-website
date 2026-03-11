'use client'

import { useState } from 'react'
import { acceptRegistration, declineRegistration } from './actions'
import { CheckCircle, XCircle, Clock, Download, FileText } from 'lucide-react'
import { downloadExcel, downloadStatisticsSheet } from '@/lib/excel-export'
import { downloadPDFReport } from '@/lib/pdf-export'

export default function DashboardTable({ registrations }: any) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  let filtered = registrations.filter((r: any) => {
    const name = r.full_name || r.name || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(search.toLowerCase())
    const status = r.registration_status || r.status || 'Pending'
    const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase()
    const matchesType = typeFilter === 'all' || r.registration_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Sort
  if (sortBy === 'date') {
    filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } else if (sortBy === 'name') {
    filtered.sort((a: any, b: any) => {
      const nameA = (a.full_name || a.name || '').toLowerCase()
      const nameB = (b.full_name || b.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  } else if (sortBy === 'program') {
    filtered.sort((a: any, b: any) =>
      (a.program || a.training_program || '').localeCompare(b.program || b.training_program || '')
    )
  }

  const handleAccept = async (id: string) => {
    setLoadingId(id)
    await acceptRegistration(id)
    setLoadingId(null)
  }

  const handleDecline = async (id: string) => {
    setLoadingId(id)
    await declineRegistration(id)
    setLoadingId(null)
  }

  const getStatusBadge = (status: string | null) => {
    const s = status || 'pending'
    if (s === 'accepted') {
      return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Accepted
      </span>
    }
    if (s === 'declined') {
      return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
        <XCircle className="w-4 h-4" />
        Declined
      </span>
    }
    return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
      <Clock className="w-4 h-4" />
      Pending
    </span>
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="enrolled">Enrolled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Student">Student</option>
              <option value="Individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date (Newest)</option>
              <option value="name">Name (A-Z)</option>
              <option value="program">Program</option>
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 pt-2 border-t border-gray-200">
          <button
            onClick={() => downloadExcel({ registrations: filtered })}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
          <button
            onClick={() => downloadStatisticsSheet(filtered)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Download Stats
          </button>
          <button
            onClick={() =>
              downloadPDFReport({
                registrations: filtered,
                title: 'Energy & Logics - Applications Report',
              })
            }
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Print as PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                filtered.map((r: any) => {
                  const name = r.full_name || r.name || 'N/A'
                  const status = r.registration_status || r.status || 'Pending'
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.registration_type || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.program || r.training_program || '-'}</td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            disabled={loadingId === r.id || status.toLowerCase() === 'accepted'}
                            onClick={() => handleAccept(r.id)}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors text-sm font-medium"
                          >
                            Accept
                          </button>
                          <button
                            disabled={loadingId === r.id || status.toLowerCase() === 'declined'}
                            onClick={() => handleDecline(r.id)}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors text-sm font-medium"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          Showing {filtered.length} of {registrations.length} applications
        </div>
      </div>
    </div>
  )
}
