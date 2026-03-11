'use client';

import Link from 'next/link';

export default function StudentPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Student Portal</h1>
      <div className="flex flex-col gap-4">
        <Link href="/student/login" className="text-blue-600 underline">Login</Link>
        <Link href="/student/dashboard" className="text-blue-600 underline">Dashboard</Link>
        <Link href="/student/profile" className="text-blue-600 underline">Profile</Link>
        <Link href="/student/documents" className="text-blue-600 underline">Documents</Link>
        <Link href="/student/certificates" className="text-blue-600 underline">Certificates</Link>
        <Link href="/student/announcements" className="text-blue-600 underline">Announcements</Link>
      </div>
    </div>
  )
}