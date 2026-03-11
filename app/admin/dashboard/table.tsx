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
          filtered.map((r) => {
            const name = r.full_name || 'N/A'
            const status = r.registration_status || 'Pending'

            return (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">

                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {name}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {r.email}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {r.registration_type || '-'}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {r.program || '-'}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {r.duration || '-'}
                </td>

                <td className="px-6 py-4 text-sm">
                  {getStatusBadge(status)}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2 justify-center">

                    {/* Accept */}
                    <button
                      disabled={loadingId === r.id || status.toLowerCase() === 'accepted'}
                      onClick={() => handleAccept(r.id)}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors text-sm font-medium"
                    >
                      Accept
                    </button>

                    {/* Decline */}
                    <button
                      disabled={loadingId === r.id || status.toLowerCase() === 'declined'}
                      onClick={() => handleDecline(r.id)}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors text-sm font-medium"
                    >
                      Decline
                    </button>

                    {/* Certificate */}
                    <button
                      disabled={status.toLowerCase() !== 'accepted'}
                      onClick={() => generateCertificate(r)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors text-sm font-medium"
                    >
                      Certificate
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