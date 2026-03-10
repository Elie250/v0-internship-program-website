'use client'

import { useState } from 'react'
import { acceptRegistration, declineRegistration } from './actions'

export default function DashboardTable({ registrations }: any) {

  const [search, setSearch] = useState('')

  const filtered = registrations.filter((r: any) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (

    <div>

      <input
        placeholder="Search applicant..."
        className="border p-2 mb-6 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Name</th>
            <th>Type</th>
            <th>School / Profession</th>
            <th>Program</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filtered.map((r: any) => (

            <tr key={r.id} className="border-t">

              <td className="p-2">{r.full_name}</td>

              <td className="p-2">{r.registration_type}</td>

              <td className="p-2">{r.school || r.profession}</td>

              <td className="p-2">{r.program || r.training_program}</td>

              <td className="p-2">{r.status || 'pending'}</td>

              <td className="p-2 flex gap-2">

                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => acceptRegistration(r.id)}
                >
                  Accept
                </button>

                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => declineRegistration(r.id)}
                >
                  Decline
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}