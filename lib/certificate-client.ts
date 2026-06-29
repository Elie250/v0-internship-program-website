import {
  createCertificateHTML,
  generateCertificateId,
  type CertificateData,
} from '@/lib/certificate-template'

type ApplicationCertificateInput = {
  id: string
  full_name?: string
  name?: string
  program?: string | null
  created_at?: string
}

export function printApplicationCertificate(row: ApplicationCertificateInput): void {
  const data: CertificateData = {
    fullName: row.full_name || row.name || 'Participant',
    program: row.program || 'Energy & Logics Training Programme',
    completionDate: row.created_at ? new Date(row.created_at) : new Date(),
    certificateId: generateCertificateId(),
  }

  const html = createCertificateHTML(data)
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(html)
  printWindow.document.close()
}
