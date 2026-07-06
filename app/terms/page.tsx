import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'
import { termsSections } from '@/lib/legal/content'
import { COMPANY } from '@/lib/company/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Terms & Conditions | ${COMPANY.brandName}`,
  description: `Terms of use for ${COMPANY.platformName} — enrollments, payments, certificates, and platform conduct.`,
}

export default function TermsPage() {
  return (
    <LegalDocumentLayout
      title="Terms & Conditions"
      intro={`Rules for using ${COMPANY.publicSiteUrl}, creating an account, enrolling in programmes, and making payments.`}
      sections={termsSections}
    />
  )
}
