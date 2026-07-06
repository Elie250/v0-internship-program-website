'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award } from 'lucide-react'

export function CertificateStatusBanner({ courseId }: { courseId: string }) {
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/student/certificates', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ status?: string; course_id?: string }>) => {
        const match = Array.isArray(rows)
          ? rows.find((c) => String(c.course_id) === courseId)
          : undefined
        setStatus(match?.status ?? null)
      })
      .catch(() => {})
  }, [courseId])

  if (!status) return null

  if (status === 'pending_admin') {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold flex items-center gap-2">
          <Award className="h-4 w-4" />
          Certificate — lecturer approved, awaiting admin stamp
        </p>
        <p className="mt-1 text-amber-800">
          You can preview your certificate now. The official stamp and signature will be added after
          admin approval.{' '}
          <Link href="/student/certificates" className="font-medium underline">
            View certificates
          </Link>
        </p>
      </div>
    )
  }

  if (status === 'issued') {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold flex items-center gap-2">
          <Award className="h-4 w-4" />
          Your official certificate is ready
        </p>
        <p className="mt-1">
          <Link href="/student/certificates" className="font-medium underline">
            Download or print your certificate
          </Link>
        </p>
      </div>
    )
  }

  return null
}
