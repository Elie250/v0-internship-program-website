const MAX_IMAGES = 8

export function parseProductImages(
  raw: unknown
): { ok: true; value: string[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: [] }
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' && raw.trim() ? [raw] : []
  if (list.length > MAX_IMAGES) return { ok: false, error: 'A product can have at most 8 images' }
  const urls: string[] = []
  for (const item of list) {
    const url = String(item ?? '').trim()
    if (!url) continue
    if (!/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'Each image must be an http(s) URL' }
    }
    urls.push(url)
  }
  return { ok: true, value: urls }
}
