'use client'

import { useState } from 'react'
import { acceptApplication, declineApplication } from './actions'

export default function DashboardTable({ registrations }: any) {

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = registrations || []

  const handleAccept = async (id: string) => {
    setLoadingId(id)
    await acceptApplication(id)
    window.location.reload()
  }

  const handleDecline = async (id: string) => {
    setLoadingId(id)
    await declineApplication(id)
    window.location.reload()
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()

    if (s === 'accepted') {
      return (
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
          Accepted
        </span>
      )
    }

    if (s === 'declined') {
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
          Declined
        </span>
      )
    }

    return (
      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
        Pending
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">

      <div className="overflow-x-auto">
        <table className="w-full">

          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No applications found
                </td>
              </tr>
            ) : (
              filtered.map((r: any) => {
                const name = r.full_name || 'N/A'
                const status = r.status || 'pending'

                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.registration_type || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.program || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.duration || '-'}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2 justify-center">
                        {/* Accept */}
                        <button
                          disabled={loadingId === r.id || status === 'accepted'}
                          onClick={() => handleAccept(r.id)}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors text-sm font-medium"
                        >
                          Accept
                        </button>

                        {/* Decline */}
                        <button
                          disabled={loadingId === r.id || status === 'declined'}
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

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        Showing {filtered.length} of {registrations.length} applications
      </div>

    </div>
  )
}