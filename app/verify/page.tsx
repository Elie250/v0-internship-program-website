import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { CertificateVerifyForm } from '@/components/certificate/certificate-verify-form'
import { COMPANY } from '@/lib/company/constants'
import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: `Verify certificate | ${COMPANY.brandName}`,
  description: `Confirm that an Energy and Logics certificate is authentic by entering its certificate ID.`,
}

export default function VerifyCertificateLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <ShieldCheck className="h-12 w-12 mx-auto text-[var(--brand-navy)]" />
            <h1 className="text-2xl font-bold text-slate-900">Certificate verification</h1>
            <p className="text-slate-600 text-sm">
              Enter the certificate ID from an {COMPANY.legalName} certificate to confirm the
              recipient name, programme, and passing score match our records.
            </p>
          </div>
          <CertificateVerifyForm />
          <p className="text-center text-xs text-slate-500">
            Official verification portal —{' '}
            <Link
              href={COMPANY.publicSiteUrl}
              className="text-[var(--brand-navy)] underline underline-offset-2"
            >
              www.energyandlogics.com
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
