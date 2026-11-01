/** Display-only course-card copy. Does not rewrite stored descriptions. */
export function normalizeCourseCardDescription(value: unknown): string {
  if (value == null) return ''

  let text = String(value)
  text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const point = Number(code)
      return Number.isFinite(point) ? String.fromCharCode(point) : ' '
    })
  text = text.replace(/[\r\n\u0085\u2028\u2029\f\v]+/g, ' ')
  return text.replace(/\s+/g, ' ').trim()
}
