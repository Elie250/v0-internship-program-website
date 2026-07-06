import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'
import { privacyPolicySections } from '@/lib/legal/content'
import { COMPANY } from '@/lib/company/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Privacy Policy | ${COMPANY.brandName}`,
  description: `How ${COMPANY.legalName} collects, uses, and protects your personal data on the ${COMPANY.platformName} platform.`,
}

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      intro={`How we handle your personal information when you use ${COMPANY.platformName}, enroll in programmes, make payments, or contact ${COMPANY.brandName}.`}
      sections={privacyPolicySections}
    />
  )
}
