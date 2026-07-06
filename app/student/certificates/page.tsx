'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Download, Eye } from 'lucide-react'
import { createCertificateHTML } from '@/lib/certificate-template'
import {
  getCertificateQrImageUrl,
  getCertificateVerifyUrl,
} from '@/lib/certificate/verify'

type CertificateRow = {
  id: string
  certificate_code: string
  student_name: string
  program_title: string
  issued_at: string
  final_score?: number | null
  is_free?: boolean
  status?: string
}

export default function StudentCertificates() {
  const router = useRouter()
  const [certs, setCerts] = useState<CertificateRow[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getStudentPortalData(),
      fetch('/api/student/certificates', { credentials: 'same-origin' }).then((res) => res.json()),
    ]).then(([portal, certData]) => {
      if (!portal.success) {
        router.push('/auth/login?redirect=/student/certificates')
        return
      }
      setUserName(
        [portal.data.user.firstName, portal.data.user.lastName].filter(Boolean).join(' ') ||
          portal.data.user.email
      )
      setCerts(Array.isArray(certData) ? certData : [])
      setLoading(false)
    })
  }, [router])

  const printCert = (cert: CertificateRow) => {
    const origin = window.location.origin
    const isOfficial = (cert.status ?? 'issued') === 'issued'
    const verifyUrl = isOfficial ? getCertificateVerifyUrl(cert.certificate_code) : undefined
    const html = createCertificateHTML({
      fullName: cert.student_name,
      program: cert.program_title,
      completionDate: new Date(cert.issued_at),
      certificateId: cert.certificate_code,
      finalScore: cert.final_score ?? null,
      freeCourse: cert.is_free === true,
      pendingApproval: !isOfficial,
      assetBaseUrl: origin,
      verifyUrl,
      qrImageUrl: isOfficial ? getCertificateQrImageUrl(cert.certificate_code) : undefined,
    })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
  }

  return (
    <StudentPortalShell userName={userName}>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My certificates</h1>
          <p className="text-slate-600 text-sm mt-1">
            After your lecturer confirms completion, you can preview your certificate here. The
            official stamp and signature are added once admin gives final approval.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading…</p>
        ) : certs.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-10 text-center">
              <Award className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-700">No certificates yet. Complete your programme assessment to qualify.</p>
              <Link href="/student/dashboard" className="inline-block mt-4">
                <Button variant="outline" className="text-slate-900 border-slate-300">
                  Back to my learning
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {certs.map((cert) => {
              const isOfficial = (cert.status ?? 'issued') === 'issued'
              return (
                <Card key={cert.id} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                        <Award className="h-5 w-5 text-[var(--brand-navy)]" />
                        {cert.program_title}
                      </CardTitle>
                      {isOfficial ? (
                        <Badge className="bg-green-100 text-green-800">Official — stamped</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-900">Pending admin stamp</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap justify-between gap-3 items-center text-sm">
                    <div>
                      <p className="text-slate-700">
                        {isOfficial ? 'Issued' : 'Lecturer approved'}{' '}
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-800 mt-1">
                        {cert.certificate_code}
                      </p>
                      {!isOfficial ? (
                        <p className="text-xs text-amber-800 mt-2 max-w-md">
                          Preview only — watermark shown until admin stamps and signs the
                          certificate. Public verification unlocks after approval.
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      onClick={() => printCert(cert)}
                      className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                    >
                      {isOfficial ? (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download / print
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview certificate
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </StudentPortalShell>
  )
}
