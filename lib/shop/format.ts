/** Shared display helpers for Shop portal (RWF, dates). */

export function formatShopRwf(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0
  return `${n.toLocaleString('en-RW')} RWF`
}

export function formatShopInteger(value: number): string {
  const n = Number.isFinite(value) ? Math.round(value) : 0
  return n.toLocaleString('en-RW')
}
