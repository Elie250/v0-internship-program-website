import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'
import { refundPolicySections } from '@/lib/legal/content'
import { COMPANY } from '@/lib/company/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Refund Policy | ${COMPANY.brandName}`,
  description: `Refund rules for MTN MoMo and IremboPay payments on ${COMPANY.platformName}.`,
}

export default function RefundPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Refund Policy"
      intro={`When refunds may apply for programme enrollments, shop orders, and support subscriptions.`}
      sections={refundPolicySections}
    />
  )
}
