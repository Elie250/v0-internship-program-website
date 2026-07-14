import { jsPDF } from 'jspdf'
import { COMPANY } from '@/lib/company/constants'

const BRAND_NAVY: [number, number, number] = [30, 58, 95]
const HEADER_PANEL: [number, number, number] = [40, 70, 110]
const BRAND_GOLD: [number, number, number] = [184, 148, 31]
const MUTED_ON_DARK: [number, number, number] = [200, 210, 225]
const WHITE: [number, number, number] = [255, 255, 255]

export const REPORT_SITE_DISPLAY = 'www.energyandlogics.com'

let cachedLogoDataUrl: string | null | undefined
let cachedAuthority:
  | {
      stampDataUrl: string | null
      signatoryName: string
      signatoryRole: string
    }
  | undefined

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.size) return null
    return blobToDataUrl(blob)
  } catch {
    return null
  }
}

function toAbsoluteMediaUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${value.startsWith('/') ? '' : '/'}${value}`
  }
  const base = COMPANY.publicSiteUrl.replace(/\/$/, '')
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`
}

type PublicBrandingPayload = {
  logoUrl?: string
  stampUrl?: string
  signatoryName?: string
  signatoryTitle?: string
}

async function loadPublicBranding(): Promise<PublicBrandingPayload> {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/public/certificate-branding', { cache: 'no-store' })
    if (!res.ok) return {}
    return (await res.json()) as PublicBrandingPayload
  }

  const { loadCertificateBranding } = await import('@/lib/certificate/branding')
  const branding = await loadCertificateBranding()
  return {
    logoUrl: toAbsoluteMediaUrl(branding.logoUrl) || branding.logoUrl,
    stampUrl: toAbsoluteMediaUrl(branding.stampUrl) || branding.stampUrl,
    signatoryName: branding.signatoryName,
    signatoryTitle: branding.signatoryTitle,
  }
}

export async function loadReportLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl

  try {
    const branding = await loadPublicBranding()
    const logoCandidate = branding.logoUrl || toAbsoluteMediaUrl(COMPANY.logoUrl)
    if (logoCandidate) {
      const fromBranding = await fetchImageDataUrl(logoCandidate)
      if (fromBranding) {
        cachedLogoDataUrl = fromBranding
        return cachedLogoDataUrl
      }
    }
  } catch {
    // fall through
  }

  if (typeof window === 'undefined') {
    try {
      const { promises: fs } = await import('fs')
      const path = await import('path')
      const file = path.join(process.cwd(), 'public', 'images', 'energy-logics-logo-full.png')
      const buf = await fs.readFile(file)
      cachedLogoDataUrl = `data:image/png;base64,${buf.toString('base64')}`
      return cachedLogoDataUrl
    } catch {
      cachedLogoDataUrl = null
      return null
    }
  }

  cachedLogoDataUrl = await fetchImageDataUrl(toAbsoluteMediaUrl('/images/energy-logics-logo-full.png'))
  return cachedLogoDataUrl
}

export async function loadReportAuthorityAssets(): Promise<{
  stampDataUrl: string | null
  signatoryName: string
  signatoryRole: string
}> {
  if (cachedAuthority) return cachedAuthority

  const fallback = {
    stampDataUrl: null as string | null,
    signatoryName: 'Elie BISAMAZA',
    signatoryRole: 'Managing Director',
  }

  try {
    const branding = await loadPublicBranding()
    const stampUrl = branding.stampUrl || toAbsoluteMediaUrl('/images/company-stamp.png')
    const role =
      String(branding.signatoryTitle || '')
        .split('·')[0]
        ?.trim() || 'Managing Director'
    cachedAuthority = {
      stampDataUrl: stampUrl ? await fetchImageDataUrl(stampUrl) : null,
      signatoryName: branding.signatoryName?.trim() || fallback.signatoryName,
      signatoryRole: role,
    }
    return cachedAuthority
  } catch {
    cachedAuthority = fallback
    return cachedAuthority
  }
}

export type ReportHeaderOptions = {
  title: string
  reportRange?: string
  subtitle?: string
  logoDataUrl?: string | null
  generatedAt?: Date
}

export function drawReportHeader(doc: jsPDF, options: ReportHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const rightEdge = pageWidth - margin
  const generated = (options.generatedAt ?? new Date()).toLocaleString()

  const rangeLine =
    options.reportRange != null
      ? options.reportRange
      : options.subtitle?.replace(/^Report range:\s*/i, '') || undefined

  const leftInfo = [
    `Location  ${COMPANY.address} · ${COMPANY.region}`,
    `Contacts  ${COMPANY.email}  ·  ${COMPANY.phoneDisplay}  ·  ${REPORT_SITE_DISPLAY}`,
  ]
  const rightInfo: string[] = []
  if (rangeLine) rightInfo.push(`Report range  ${rangeLine}`)
  rightInfo.push(`Generated  ${generated}`)

  const leftColWidth = pageWidth * 0.55 - margin
  const rightColWidth = pageWidth * 0.42 - margin

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const leftWrapped = leftInfo.flatMap((line) => doc.splitTextToSize(line, leftColWidth))
  const rightWrapped = rightInfo.flatMap((line) => doc.splitTextToSize(line, rightColWidth))
  const infoLines = Math.max(leftWrapped.length, rightWrapped.length, 2)

  const topStripH = 22
  const infoBlockH = 6 + infoLines * 4.2 + 4
  const totalHeaderH = topStripH + infoBlockH

  doc.setFillColor(...HEADER_PANEL)
  doc.rect(0, 0, pageWidth, totalHeaderH, 'F')

  doc.setFillColor(...BRAND_NAVY)
  doc.rect(0, 0, pageWidth, topStripH, 'F')

  doc.setFillColor(...BRAND_GOLD)
  doc.rect(0, totalHeaderH, pageWidth, 1.2, 'F')

  const headerTop = 7
  let textLeft = margin

  if (options.logoDataUrl) {
    try {
      const format = options.logoDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG'
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, headerTop - 1, 18, 14, 1.5, 1.5, 'F')
      doc.addImage(options.logoDataUrl, format, margin + 1.5, headerTop + 0.5, 15, 11)
      textLeft = margin + 22
    } catch {
      // text-only
    }
  }

  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(COMPANY.legalName, textLeft, headerTop + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED_ON_DARK)
  doc.text(COMPANY.slogan, textLeft, headerTop + 11)

  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const titleLines = doc.splitTextToSize(options.title, rightColWidth)
  doc.text(titleLines, rightEdge, headerTop + 7, { align: 'right' })

  const infoY = topStripH + 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED_ON_DARK)

  let ly = infoY
  for (const line of leftWrapped) {
    doc.text(line, margin, ly)
    ly += 4.2
  }

  let ry = infoY
  for (const line of rightWrapped) {
    doc.text(line, rightEdge, ry, { align: 'right' })
    ry += 4.2
  }

  return totalHeaderH + 8
}

export function companyLetterheadRows(reportRange?: string): Array<Array<string | number>> {
  return [
    [COMPANY.legalName],
    [COMPANY.slogan],
    [`Location: ${COMPANY.address} · ${COMPANY.region}`],
    [`Contacts: ${COMPANY.email} · ${COMPANY.phoneDisplay} · ${REPORT_SITE_DISPLAY}`],
    ...(reportRange ? [[`Report range: ${reportRange}`] as Array<string | number>] : []),
    [`Generated: ${new Date().toLocaleString()}`],
    [],
  ]
}

export function drawReportFooter(doc: jsPDF, pageNumber: number, pageCount: number): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(
    `${COMPANY.legalName} · ${REPORT_SITE_DISPLAY} · Confidential · Page ${pageNumber} of ${pageCount}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )
}

/** Stamp centered over Managing Director name + title (certificate-style). */
export function drawReportAuthorityBlock(
  doc: jsPDF,
  options: {
    stampDataUrl?: string | null
    signatoryName: string
    signatoryRole?: string
    startY?: number
  }
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const role = options.signatoryRole || 'Managing Director'
  const blockH = 42
  const footerReserve = 16
  let y = options.startY ?? pageHeight - blockH - footerReserve

  if (y + blockH > pageHeight - footerReserve) {
    doc.addPage()
    y = 24
  }

  const centerX = pageWidth / 2
  const nameY = y + 22
  const titleY = nameY + 8
  const ruleY = nameY + 3

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 95)
  doc.text(options.signatoryName.toUpperCase(), centerX, nameY, { align: 'center' })

  doc.setDrawColor(45, 55, 72)
  doc.setLineWidth(0.4)
  doc.line(centerX - 28, ruleY, centerX + 28, ruleY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 100, 114)
  doc.text(role, centerX, titleY, { align: 'center' })

  if (options.stampDataUrl) {
    try {
      const format = options.stampDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG'
      const stampSize = 34
      doc.addImage(
        options.stampDataUrl,
        format,
        centerX - stampSize / 2,
        nameY - stampSize / 2 + 2,
        stampSize,
        stampSize,
        undefined,
        'FAST'
      )
    } catch {
      // text-only
    }
  }
}

export function drawReportAuthorityAfterContent(
  doc: jsPDF,
  authority: {
    stampDataUrl?: string | null
    signatoryName: string
    signatoryRole?: string
  },
  fallbackY = 40
): void {
  const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable
  const startY = (lastTable?.finalY ?? fallbackY) + 16
  drawReportAuthorityBlock(doc, { ...authority, startY })
}
