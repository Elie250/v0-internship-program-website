/**
 * Normalize stored media URLs so covers render even when uploads saved
 * protocol-relative hosts, bare domains, or object keys without https://.
 * Client-safe (no Node/S3 imports).
 */
export function normalizePublicMediaUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null
  let s = String(raw)
    .trim()
    .replace(/^[\u200B-\u200D\uFEFF]+/, '')
  if (!s) return null

  if (s.startsWith('//')) s = `https:${s}`

  if (/^https?:\/\//i.test(s)) return s

  // Same-origin absolute path
  if (s.startsWith('/')) return s

  // Bare host/path without scheme
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:].*)?$/i.test(s)) {
    return `https://${s}`
  }

  // Storage object key: brain-games/….jpg — resolve via public CDN base when available
  if (/^[\w.-]+\/[\w./+-]+$/i.test(s)) {
    let base =
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ||
      process.env.R2_PUBLIC_BASE_URL?.trim() ||
      ''
    if (!base) return null
    base = base.replace(/\/$/, '')
    if (base.startsWith('//')) base = `https:${base}`
    else if (!/^https?:\/\//i.test(base)) base = `https://${base}`
    return `${base}/${s.replace(/^\//, '')}`
  }

  return null
}
