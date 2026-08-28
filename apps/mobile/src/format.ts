export function formatRwf(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0
  return `${n.toLocaleString('en-RW')} RWF`
}

export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
