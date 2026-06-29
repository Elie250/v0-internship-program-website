'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, Download } from 'lucide-react'
import { createCertificateHTML } from '@/lib/certificate-template'

type CertificateRow = {
  id: string
  certificate_code: string
  student_name: string
  program_title: string
  issued_at: string
}

export default function StudentCertificates() {
  const [certs, setCerts] = useState<CertificateRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/certificates', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => setCerts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const printCert = (cert: CertificateRow) => {
    const html = createCertificateHTML({
      fullName: cert.student_name,
      program: cert.program_title,
      completionDate: new Date(cert.issued_at),
      certificateId: cert.certificate_code,
    })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900">My certificates</h1>
      <p className="text-slate-600">
        Certificates are issued for paid programmes after you pass the final assessment and receive
        lecturer and admin confirmation.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : certs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No certificates yet. Complete your programme assessment to qualify.</p>
            <Link href="/student/dashboard" className="inline-block mt-4">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {certs.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-[var(--brand-navy)]" />
                  {cert.program_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap justify-between gap-3 items-center text-sm">
                <div>
                  <p className="text-slate-600">Issued {new Date(cert.issued_at).toLocaleDateString()}</p>
                  <p className="font-mono text-xs text-slate-500 mt-1">{cert.certificate_code}</p>
                </div>
                <Button type="button" onClick={() => printCert(cert)} className="bg-[var(--brand-navy)] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download / print
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
