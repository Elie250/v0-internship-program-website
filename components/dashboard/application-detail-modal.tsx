'use client'

import { X } from 'lucide-react'

interface ApplicationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
}

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
}: ApplicationDetailModalProps) {
  if (!isOpen || !application) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{application.full_name}</h2>
            <p className="text-blue-100 mt-1">{application.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900 mt-1">{application.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900 mt-1">{application.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900 mt-1">{application.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Registration Type</label>
                <p className="text-gray-900 mt-1">{application.registration_type || 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Program Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Program Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Program</label>
                <p className="text-gray-900 mt-1">{application.program || application.training_program || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Level</label>
                <p className="text-gray-900 mt-1">{application.level || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Duration</label>
                <p className="text-gray-900 mt-1">{application.duration || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      application.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : application.status === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {(application.status || 'pending').charAt(0).toUpperCase() +
                      (application.status || 'pending').slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Institution/Profession */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Institution / Profession
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">School</label>
                <p className="text-gray-900 mt-1">{application.school || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Profession</label>
                <p className="text-gray-900 mt-1">{application.profession || 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Message */}
          {application.message && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Additional Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{application.message}</p>
              </div>
            </section>
          )}

          {/* Dates */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Applied On</label>
                <p className="text-gray-900 mt-1">
                  {new Date(application.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {application.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(application.updated_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Certificate Status */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Certificate
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-600">Certificate Generated</label>
              <p className="text-gray-900 mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    application.certificate_generated
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {application.certificate_generated ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
