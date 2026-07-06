import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { CheckCircle2, XCircle } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ code: string }>
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params
  const certificateCode = decodeURIComponent(code).trim().toUpperCase()

  let certificate: {
    student_name: string
    program_title: string
    issued_at: string
    final_score?: number | null
  } | null = null

  if (supabaseAdmin && certificateCode) {
    const { data } = await supabaseAdmin
      .from('student_certificates')
      .select('student_name, program_title, issued_at, final_score')
      .eq('certificate_code', certificateCode)
      .maybeSingle()
    certificate = data
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          {certificate ? (
            <>
              <CheckCircle2 className="h-14 w-14 mx-auto text-green-600" />
              <h1 className="text-2xl font-bold text-slate-900">Certificate verified</h1>
              <p className="text-slate-600 text-sm">
                This certificate was issued by Energy and Logics Ltd and is authentic.
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Recipient:</span>{' '}
                  <strong className="text-slate-900">{certificate.student_name}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Programme:</span>{' '}
                  <strong className="text-slate-900">{certificate.program_title}</strong>
                </p>
                {certificate.final_score != null ? (
                  <p>
                    <span className="text-slate-500">Final average score:</span>{' '}
                    <strong className="text-slate-900">{certificate.final_score}%</strong>
                  </p>
                ) : null}
                <p>
                  <span className="text-slate-500">Issued:</span>{' '}
                  <strong className="text-slate-900">
                    {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Certificate ID:</span>{' '}
                  <span className="font-mono text-xs text-slate-800">{certificateCode}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-14 w-14 mx-auto text-red-500" />
              <h1 className="text-2xl font-bold text-slate-900">Certificate not found</h1>
              <p className="text-slate-600 text-sm">
                No certificate matches the code{' '}
                <span className="font-mono text-slate-800">{certificateCode || '—'}</span>. Check the
                ID printed on the certificate and try again, or contact Energy and Logics Ltd.
              </p>
            </>
          )}
          <Link
            href="/"
            className="inline-block text-sm text-[var(--brand-navy)] underline underline-offset-2"
          >
            energyandlogics.com
          </Link>
        </div>
      </main>
    </div>
  )
}
