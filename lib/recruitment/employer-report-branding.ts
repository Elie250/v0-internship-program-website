/** Shared org logo fetch for internal Talent PDFs. Safe on server. */

export async function loadEmployerLogoDataUrl(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl?.trim()) return null
  try {
    const res = await fetch(logoUrl, { cache: 'no-store' })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('svg')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (!buffer.length) return null
    const mime = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/png'
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export function formatRecommendationLabel(value: string | null | undefined): string {
  switch (value) {
    case 'strong_yes':
      return 'Strong yes'
    case 'yes':
      return 'Yes'
    case 'neutral':
      return 'Neutral'
    case 'no':
      return 'No'
    case 'strong_no':
      return 'Strong no'
    default:
      return value?.trim() || '—'
  }
}

export function averageScores(values: number[]): number | null {
  if (values.length === 0) return null
  const total = values.reduce((sum, n) => sum + n, 0)
  return Math.round((total / values.length) * 10) / 10
}
