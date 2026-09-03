/** First usable product image URL from the existing staff products payload. */
export function firstProductImage(images: unknown): string | null {
  if (typeof images === 'string' && /^https?:\/\//i.test(images.trim())) {
    return images.trim()
  }
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  if (typeof first === 'string' && /^https?:\/\//i.test(first.trim())) {
    return first.trim()
  }
  if (first && typeof first === 'object') {
    const record = first as { url?: unknown; src?: unknown }
    const url = String(record.url || record.src || '').trim()
    if (/^https?:\/\//i.test(url)) return url
  }
  return null
}
