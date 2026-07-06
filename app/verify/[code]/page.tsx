import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { CertificateVerifyForm } from '@/components/certificate/certificate-verify-form'
import { lookupCertificate } from '@/lib/certificate/verify'
import { COMPANY } from '@/lib/company/constants'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ code: string }>
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params
  const result = await lookupCertificate(code)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-5">
          {result.status === 'verified' ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-14 w-14 mx-auto text-green-600" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Certificate verified</h1>
                <p className="text-slate-600 text-sm">
                  The details below match {COMPANY.legalName}&apos;s official records.
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 text-left space-y-2.5 text-sm">
                <p>
                  <span className="text-slate-500">Recipient:</span>{' '}
                  <strong className="text-slate-900">{result.studentName}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Programme:</span>{' '}
                  <strong className="text-slate-900">{result.programTitle}</strong>
                </p>
                {result.finalScore != null ? (
                  <p>
                    <span className="text-slate-500">Final average score:</span>{' '}
                    <strong className="text-slate-900">{result.finalScore}%</strong>
                    <span className="text-slate-600"> (passed)</span>
                  </p>
                ) : null}
                <p>
                  <span className="text-slate-500">Date issued:</span>{' '}
                  <strong className="text-slate-900">
                    {new Date(result.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Certificate ID:</span>{' '}
                  <span className="font-mono text-xs text-slate-800">{result.certificateCode}</span>
                </p>
              </div>
            </div>
          ) : result.status === 'pending' ? (
            <div className="text-center space-y-4">
              <Clock className="h-14 w-14 mx-auto text-amber-500" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Pending approval</h1>
                <p className="text-slate-600 text-sm">{result.message}</p>
                <p className="font-mono text-xs text-slate-500 mt-2">{result.certificateCode}</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <XCircle className="h-14 w-14 mx-auto text-red-500" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Certificate not found</h1>
                <p className="text-slate-600 text-sm">
                  No issued certificate matches{' '}
                  <span className="font-mono text-slate-800">
                    {result.certificateCode || '—'}
                  </span>
                  . Check the ID on the certificate and try again.
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5 space-y-3">
            <p className="text-sm font-medium text-slate-700 text-center">Verify another certificate</p>
            <CertificateVerifyForm initialCode="" />
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/verify" className="text-[var(--brand-navy)] underline underline-offset-2">
              Verification home
            </Link>
            <Link href="/" className="text-[var(--brand-navy)] underline underline-offset-2">
              www.energyandlogics.com
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
