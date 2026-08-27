/** Shared display helpers for Shop portal (RWF, dates). */

export function formatShopRwf(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0
  return `${n.toLocaleString('en-RW')} RWF`
}

export function formatShopInteger(value: number): string {
  const n = Number.isFinite(value) ? Math.round(value) : 0
  return n.toLocaleString('en-RW')
}

/** Customer-facing long date, e.g. 27 August 2026. */
export function formatShopLongDate(iso: string, locale: string = 'en'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const tag = locale === 'rw' ? 'rw-RW' : 'en-GB'
  return d.toLocaleDateString(tag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
