'use client';

import Link from 'next/link';

export default function StudentPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">
          Student Portal
        </h1>

        {/* Card container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/student/login"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition flex items-center justify-center font-semibold text-blue-600"
          >
            Login
          </Link>

          <Link
            href="/student/dashboard"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition flex items-center justify-center font-semibold text-blue-600"
          >
            Dashboard
          </Link>

          <Link
            href="/student/profile"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition flex items-center justify-center font-semibold text-blue-600"
          >
            Profile
          </Link>

          <Link
            href="/student/documents"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition flex items-center justify-center font-semibold text-blue-600"
          >
            Documents
          </Link>

          <Link
            href="/student/certificates"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition flex items-center justify-center font-semibold text-blue-600"
          >
            Certificates
          </Link>

          <Link
            href="/student/announcements"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition flex items-center justify-center font-semibold text-blue-600"
          >
            Announcements
          </Link>
        </div>
      </div>
    </div>
  )
}