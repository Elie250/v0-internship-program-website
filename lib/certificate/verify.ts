import { COMPANY } from '@/lib/company/constants'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type CertificateVerification =
  | {
      status: 'verified'
      certificateCode: string
      studentName: string
      programTitle: string
      issuedAt: string
      finalScore: number | null
    }
  | {
      status: 'pending'
      certificateCode: string
      message: string
    }
  | {
      status: 'not_found'
      certificateCode: string
    }

export function normalizeCertificateCode(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase()
}

export function getCertificateVerifyUrl(certificateCode: string): string {
  const code = encodeURIComponent(normalizeCertificateCode(certificateCode))
  return `${COMPANY.publicSiteUrl}/verify/${code}`
}

export function getCertificateQrImageUrl(certificateCode: string): string {
  const verifyUrl = getCertificateVerifyUrl(certificateCode)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(verifyUrl)}`
}

export async function lookupCertificate(
  rawCode: string
): Promise<CertificateVerification> {
  const certificateCode = normalizeCertificateCode(rawCode)

  if (!certificateCode) {
    return { status: 'not_found', certificateCode: '' }
  }

  if (!supabaseAdmin) {
    return { status: 'not_found', certificateCode }
  }

  const { data } = await supabaseAdmin
    .from('student_certificates')
    .select('student_name, program_title, issued_at, final_score, status')
    .eq('certificate_code', certificateCode)
    .maybeSingle()

  if (!data) {
    return { status: 'not_found', certificateCode }
  }

  const rowStatus = (data.status as string | null) ?? 'issued'
  if (rowStatus === 'pending_admin') {
    return {
      status: 'pending',
      certificateCode,
      message:
        'This certificate is awaiting final approval from Energy and Logics Ltd and cannot be verified yet.',
    }
  }

  if (rowStatus !== 'issued') {
    return { status: 'not_found', certificateCode }
  }

  return {
    status: 'verified',
    certificateCode,
    studentName: data.student_name,
    programTitle: data.program_title,
    issuedAt: data.issued_at,
    finalScore: data.final_score != null ? Number(data.final_score) : null,
  }
}
