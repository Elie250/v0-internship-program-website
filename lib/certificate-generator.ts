import {
  createCertificateHTML,
  generateCertificateId,
  type CertificateData,
} from '@/lib/certificate-template'

export type { CertificateData }
export { generateCertificateId, createCertificateHTML }

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  const html = createCertificateHTML(data)
  return Buffer.from(html, 'utf-8')
}
