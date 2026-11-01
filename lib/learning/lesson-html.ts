/** Must stay equal to `MAX_BLOCK_TEXT` in lesson-blocks.ts. */
const MAX_RICH_TEXT_FIELD = 12_000

export const LESSON_RICH_TEXT_CLASSNAME = [
  'text-sm leading-7 text-slate-700',
  '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:pt-2 [&_h2]:mb-2',
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:pt-1 [&_h3]:mb-2',
  '[&_p]:mb-3 [&_p:last-child]:mb-0',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5 [&_ul]:mb-3 [&_ol]:mb-3',
  '[&_li]:my-1',
  '[&_a]:text-[var(--brand-navy)] [&_a]:underline [&_a]:underline-offset-2',
  '[&_strong]:font-semibold [&_em]:italic [&_u]:underline',
  '[&_sub]:text-[0.75em] [&_sup]:text-[0.75em]',
].join(' ')

const ALLOWED_TAGS = new Set(['p', 'h2', 'h3', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'sub', 'sup', 'a'])
const VOID_TAGS = new Set(['br'])
const BLOCK_TAGS = new Set(['p', 'h2', 'h3', 'ol', 'ul'])
const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify'])
const TAG_ALIASES: Record<string, string> = {
  b: 'strong',
  i: 'em',
  h1: 'h2',
  h4: 'h3',
  h5: 'h3',
  h6: 'h3',
}
const UNWRAP_TAGS = new Set([
  'span',
  'font',
  'div',
  'section',
  'article',
  'blockquote',
  'html',
  'body',
  'center',
])
const DROP_WITH_CHILDREN = new Set([
  'script',
  'style',
  'xml',
  'head',
  'noscript',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'img',
  'video',
  'audio',
  'svg',
  'meta',
  'link',
  'title',
])
const UNSAFE_HREF_SCHEME = /^(javascript|data|blob|file|vbscript):/i
const WORD_LIST_CLASS = /msolist/i
const WORD_LIST_STYLE = /mso-list/i
const WORD_LIST_LEVEL = /level(\d+)/i
const WORD_LIST_MARKER = /^\s*(?:[0-9]+[.)]|[•·o○■◦])\s+/

type AttrMap = Record<string, string>
type Token =
  | { kind: 'text'; value: string }
  | { kind: 'start'; name: string; attrs: AttrMap; selfClosing: boolean }
  | { kind: 'end'; name: string }

export type SanitizeLessonHtmlResult = {
  html: string
  text: string
}

export function isSafeLessonHref(value: string): { ok: true; href: string } | { ok: false } {
  const trimmed = decodeHtmlEntities(value).trim()
  if (!trimmed) return { ok: false }
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return { ok: false }
  }
  if (UNSAFE_HREF_SCHEME.test(trimmed)) return { ok: false }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') return { ok: false }
    return { ok: true, href: parsed.href }
  } catch {
    return { ok: false }
  }
}

export function plaintextToLessonHtml(text: string): string {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  if (!paragraphs.length) return ''
  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

export function sanitizeLessonHtml(raw: unknown): SanitizeLessonHtmlResult {
  if (typeof raw !== 'string' || !raw.trim()) return { html: '', text: '' }

  const preprocessed = stripWordChrome(raw)
  const tokens = tokenize(preprocessed)
  const built = emitAllowedHtml(tokens)
  const withLists = convertWordListParagraphs(built)
  const normalized = normalizeSanitizedHtml(withLists)
  return {
    html: normalized,
    text: plainTextFromLessonHtml(normalized),
  }
}

export function prepareRichTextFields(
  text: string,
  html?: string | null
): { ok: true; text: string; html?: string } | { ok: false; error: string } {
  const rawText = typeof text === 'string' ? text.trim() : ''
  const rawHtml = typeof html === 'string' ? html.trim() : ''

  if (rawText.length > MAX_RICH_TEXT_FIELD) {
    return { ok: false, error: `Explanation text cannot exceed ${MAX_RICH_TEXT_FIELD} characters` }
  }
  if (rawHtml.length > MAX_RICH_TEXT_FIELD) {
    return { ok: false, error: `Explanation HTML cannot exceed ${MAX_RICH_TEXT_FIELD} characters` }
  }

  if (!rawHtml) {
    if (!rawText) return { ok: false, error: 'Explanation text is required' }
    return { ok: true, text: rawText }
  }

  const sanitized = sanitizeLessonHtml(rawHtml)
  if (sanitized.html.length > MAX_RICH_TEXT_FIELD) {
    return { ok: false, error: `Explanation HTML cannot exceed ${MAX_RICH_TEXT_FIELD} characters` }
  }

  const nextText = (sanitized.text || rawText).trim()
  if (!nextText) return { ok: false, error: 'Explanation text is required' }
  if (nextText.length > MAX_RICH_TEXT_FIELD) {
    return { ok: false, error: `Explanation text cannot exceed ${MAX_RICH_TEXT_FIELD} characters` }
  }

  if (!sanitized.html) return { ok: true, text: nextText }
  return { ok: true, text: nextText, html: sanitized.html }
}

export function plainTextFromLessonHtml(html: string): string {
  if (!html.trim()) return ''
  const withBreaks = html
    .replace(/<\/(p|h2|h3|li|ol|ul)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  return collapsePlainText(decodeHtmlEntities(withBreaks))
}

function stripWordChrome(html: string): string {
  return html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[endif\]-->/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<xml\b[^>]*>[\s\S]*?<\/xml>/gi, '')
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?v:[^>]*>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<img\b[^>]*\/?>/gi, '')
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < html.length) {
    if (html[index] !== '<') {
      const next = html.indexOf('<', index)
      const value = next === -1 ? html.slice(index) : html.slice(index, next)
      tokens.push({ kind: 'text', value })
      index = next === -1 ? html.length : next
      continue
    }

    if (html.startsWith('<!--', index)) {
      const end = html.indexOf('-->', index + 4)
      index = end === -1 ? html.length : end + 3
      continue
    }

    if (html.startsWith('</', index)) {
      const end = html.indexOf('>', index + 2)
      if (end === -1) break
      tokens.push({ kind: 'end', name: normalizeTagName(html.slice(index + 2, end)) })
      index = end + 1
      continue
    }

    const end = html.indexOf('>', index + 1)
    if (end === -1) break
    const inner = html.slice(index + 1, end).trim()
    const selfClosing = inner.endsWith('/')
    const parts = inner.replace(/\/$/, '').match(/^([^\s]+)([\s\S]*)$/)
    if (!parts) {
      index = end + 1
      continue
    }
    tokens.push({
      kind: 'start',
      name: normalizeTagName(parts[1] || ''),
      attrs: parseAttrs(parts[2] || ''),
      selfClosing,
    })
    index = end + 1
  }

  return tokens
}

function emitAllowedHtml(tokens: Token[]): string {
  let output = ''
  const stack: string[] = []
  let droppingDepth = 0

  const closeTo = (name: string) => {
    const at = stack.lastIndexOf(name)
    if (at === -1) return
    while (stack.length > at) {
      const open = stack.pop()
      if (open && !VOID_TAGS.has(open)) output += `</${open}>`
    }
  }

  for (const token of tokens) {
    if (token.kind === 'text') {
      if (droppingDepth > 0) continue
      output += escapeHtml(decodeHtmlEntities(token.value))
      continue
    }

    if (token.kind === 'end') {
      const name = TAG_ALIASES[token.name] || token.name
      if (DROP_WITH_CHILDREN.has(token.name) || DROP_WITH_CHILDREN.has(name)) {
        droppingDepth = Math.max(0, droppingDepth - 1)
        continue
      }
      if (droppingDepth > 0) continue
      if (ALLOWED_TAGS.has(name) && !VOID_TAGS.has(name)) closeTo(name)
      continue
    }

    const mapped = TAG_ALIASES[token.name] || token.name
    if (DROP_WITH_CHILDREN.has(token.name) || DROP_WITH_CHILDREN.has(mapped)) {
      if (!token.selfClosing && !VOID_TAGS.has(mapped)) droppingDepth += 1
      continue
    }
    if (droppingDepth > 0) continue

    if (UNWRAP_TAGS.has(token.name) || UNWRAP_TAGS.has(mapped) || token.name.includes(':')) {
      continue
    }

    if (!ALLOWED_TAGS.has(mapped)) continue

    if (mapped === 'a' && !isSafeLessonHref(token.attrs.href || '').ok) {
      continue
    }

    if (VOID_TAGS.has(mapped) || token.selfClosing) {
      output += mapped === 'br' ? '<br />' : `<${mapped} />`
      continue
    }

    const attrs = allowedAttributes(mapped, token.attrs)
    output += attrs ? `<${mapped} ${attrs}>` : `<${mapped}>`
    stack.push(mapped)
  }

  while (stack.length) {
    const open = stack.pop()
    if (open && !VOID_TAGS.has(open)) output += `</${open}>`
  }

  return output
}

function allowedAttributes(tag: string, attrs: AttrMap): string {
  const out: string[] = []

  for (const [rawName, rawValue] of Object.entries(attrs)) {
    const name = rawName.toLowerCase()
    if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction' || name === 'xlink:href') {
      continue
    }

    if (tag === 'a' && name === 'href') {
      const href = isSafeLessonHref(rawValue)
      if (href.ok) {
        out.push(`href="${escapeHtml(href.href)}"`)
        out.push('rel="noopener noreferrer"')
      }
    }
  }

  if (BLOCK_TAGS.has(tag) && tag !== 'ol' && tag !== 'ul') {
    const alignment = readAlignment(attrs)
    if (alignment) out.push(`style="text-align:${alignment}"`)
  }

  if (isWordListParagraph(tag, attrs)) {
    const level = readWordListLevel(attrs)
    const listType = readWordListType(attrs)
    out.push(`data-word-list="${listType}:${level}"`)
  }

  return out.join(' ')
}

function convertWordListParagraphs(html: string): string {
  if (!html.includes('data-word-list=')) return html

  const pieces = html.split(/(<p\b[^>]*>[\s\S]*?<\/p>)/gi)
  let output = ''
  let buffer: Array<{ type: 'ol' | 'ul'; level: number; inner: string }> = []

  const flush = () => {
    if (!buffer.length) return
    output += renderNestedWordList(buffer)
    buffer = []
  }

  for (const piece of pieces) {
    const match = piece.match(/^<p\b([^>]*)>([\s\S]*?)<\/p>$/i)
    const listMeta = match?.[1]?.match(/data-word-list="(ol|ul):(\d+)"/)
    if (match && listMeta) {
      buffer.push({
        type: listMeta[1] === 'ol' ? 'ol' : 'ul',
        level: Number(listMeta[2] || 1),
        inner: String(match[2] || '').replace(WORD_LIST_MARKER, '').trim(),
      })
      continue
    }
    flush()
    output += piece
  }
  flush()
  return output
}

function renderNestedWordList(items: Array<{ type: 'ol' | 'ul'; level: number; inner: string }>): string {
  const rootType = items[0]?.type || 'ul'
  let html = `<${rootType}>`
  let depth = 1
  let currentType = rootType

  items.forEach((item, index) => {
    const level = Math.max(1, item.level)
    while (depth > level) {
      html += `</li></${currentType}>`
      depth -= 1
      currentType = rootType
    }
    if (level > depth) {
      html += `<${item.type}>`
      depth = level
      currentType = item.type
    } else if (index > 0) {
      html += '</li>'
    }
    html += `<li>${item.inner}`
  })

  while (depth > 1) {
    html += `</li></${currentType}>`
    depth -= 1
  }
  html += `</li></${rootType}>`
  return html
}

function normalizeSanitizedHtml(html: string): string {
  const compacted = html
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br /><br />')
    .replace(/<p(?:\s[^>]*)?>\s*<\/p>/gi, '')
    .replace(/<(strong|em|u|sub|sup|a)(?:\s[^>]*)?>\s*<\/\1>/gi, '')
    .trim()

  if (!compacted) return ''
  if (/^<(p|h2|h3|ol|ul)\b/i.test(compacted)) return compacted
  return `<p>${compacted}</p>`
}

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\/$/, '')
}

function parseAttrs(raw: string): AttrMap {
  const attrs: AttrMap = {}
  const pattern = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(raw))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attrs
}

function readAlignment(attrs: AttrMap): string | null {
  const fromAlign = (attrs.align || '').toLowerCase().trim()
  if (ALIGNMENTS.has(fromAlign)) return fromAlign

  const fromClass = (attrs.class || '')
    .split(/\s+/)
    .map((item) => item.toLowerCase())
    .find((item) => item.startsWith('text-') && ALIGNMENTS.has(item.slice(5)))
  if (fromClass) return fromClass.slice(5)

  const style = attrs.style || ''
  const styleMatch = style.match(/text-align\s*:\s*(left|center|right|justify)/i)
  return styleMatch?.[1]?.toLowerCase() ?? null
}

function isWordListParagraph(tag: string, attrs: AttrMap): boolean {
  if (tag !== 'p') return false
  return WORD_LIST_CLASS.test(attrs.class || '') || WORD_LIST_STYLE.test(attrs.style || '')
}

function readWordListLevel(attrs: AttrMap): number {
  const match = (attrs.style || '').match(WORD_LIST_LEVEL)
  const level = match ? Number(match[1]) : 1
  return Number.isFinite(level) && level > 0 ? Math.min(level, 6) : 1
}

function readWordListType(attrs: AttrMap): 'ol' | 'ul' {
  const style = attrs.style || ''
  if (/[0-9]/.test(style) && /lfo/i.test(style)) return 'ol'
  return 'ul'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => fromCodePoint(Number(dec)))
}

function fromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 32 && code !== 9 && code !== 10 && code !== 13) return ''
  if (code === 58) return ':'
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

function collapsePlainText(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
