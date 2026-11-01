import { z } from 'zod'

export const MAX_LESSON_BLOCKS = 80
export const MAX_BLOCK_TEXT = 12_000
export const MAX_CODE_LENGTH = 20_000

export const PHASE1_BLOCK_TYPES = [
  'heading',
  'rich_text',
  'callout',
  'image',
  'diagram',
  'code',
  'resource',
] as const

export type Phase1BlockType = (typeof PHASE1_BLOCK_TYPES)[number]

const optionalId = z.string().trim().max(64).optional()

const UNSAFE_URL_SCHEME = /^(javascript|data|blob|file|vbscript):/i
export const PREFERRED_LESSON_ASSET_HOSTS = ['media.energyandlogics.com'] as const

function isSvgPath(pathname: string): boolean {
  const path = pathname.toLowerCase()
  return path.endsWith('.svg') || path.endsWith('.svgz')
}

export function inspectLessonResourceUrl(
  value: string,
  options?: { kind?: 'media' | 'resource' }
): { ok: true; href: string } | { ok: false; error: string } {
  const trimmed = value.trim()
  if (!trimmed) return { ok: false, error: 'URL is required' }
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return { ok: false, error: 'Relative URLs are not allowed' }
  }
  if (UNSAFE_URL_SCHEME.test(trimmed)) {
    return { ok: false, error: 'Unsafe URL scheme' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'URL must start with https://' }
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'URL must start with https://' }
  }

  if (options?.kind === 'media') {
    const format = (parsed.searchParams.get('format') || parsed.searchParams.get('fm') || '').toLowerCase()
    if (isSvgPath(parsed.pathname) || format === 'svg' || format === 'svgz') {
      return { ok: false, error: 'SVG images are not allowed' }
    }
  }

  return { ok: true, href: parsed.href }
}

export function isPreferredLessonAssetHost(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    if (PREFERRED_LESSON_ASSET_HOSTS.includes(host as (typeof PREFERRED_LESSON_ASSET_HOSTS)[number])) {
      return true
    }
    const configured = (
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ||
      process.env.R2_PUBLIC_BASE_URL ||
      ''
    ).trim()
    if (!configured) return false
    return new URL(configured.startsWith('http') ? configured : `https://${configured}`).hostname.toLowerCase() === host
  } catch {
    return false
  }
}

const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .superRefine((value, ctx) => {
    const inspected = inspectLessonResourceUrl(value, { kind: 'resource' })
    if (!inspected.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: inspected.error })
    }
  })

const mediaHttpsUrl = z
  .string()
  .trim()
  .max(2000)
  .superRefine((value, ctx) => {
    const inspected = inspectLessonResourceUrl(value, { kind: 'media' })
    if (!inspected.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: inspected.error })
    }
  })

export const headingBlockSchema = z.object({
  type: z.literal('heading'),
  id: optionalId,
  level: z.union([z.literal(2), z.literal(3)]).default(2),
  text: z.string().trim().min(1).max(200),
})

export const richTextBlockSchema = z.object({
  type: z.literal('rich_text'),
  id: optionalId,
  text: z.string().trim().min(1).max(MAX_BLOCK_TEXT),
})

export const calloutBlockSchema = z.object({
  type: z.literal('callout'),
  id: optionalId,
  tone: z.enum(['info', 'warning', 'tip']).default('info'),
  text: z.string().trim().min(1).max(2000),
})

const mediaCaptionFields = {
  id: optionalId,
  url: mediaHttpsUrl,
  alt: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(400).optional(),
}

export const imageBlockSchema = z.object({
  type: z.literal('image'),
  ...mediaCaptionFields,
})

export const diagramBlockSchema = z.object({
  type: z.literal('diagram'),
  ...mediaCaptionFields,
})

export const codeBlockSchema = z.object({
  type: z.literal('code'),
  id: optionalId,
  language: z.string().trim().max(40).default('text'),
  code: z.string().min(1).max(MAX_CODE_LENGTH),
})

export const resourceBlockSchema = z.object({
  type: z.literal('resource'),
  id: optionalId,
  content_type: z.enum(['video', 'webinar', 'pdf', 'document', 'link', 'download']),
  url: httpsUrl,
})

export const lessonBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  richTextBlockSchema,
  calloutBlockSchema,
  imageBlockSchema,
  diagramBlockSchema,
  codeBlockSchema,
  resourceBlockSchema,
])

export type LessonBlock = z.infer<typeof lessonBlockSchema>

function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** Student-safe parse: keep valid Phase 1 blocks, drop unknown or invalid items. */
export function parseLessonBody(raw: unknown): LessonBlock[] {
  const items = parseJsonArray(raw).slice(0, MAX_LESSON_BLOCKS)
  const blocks: LessonBlock[] = []
  for (const item of items) {
    const parsed = lessonBlockSchema.safeParse(item)
    if (parsed.success) blocks.push(parsed.data)
  }
  return blocks
}

export function lessonBodyHasBlocks(raw: unknown): boolean {
  return parseLessonBody(raw).length > 0
}

export type EditorLessonBlock = {
  id: string
  type: Phase1BlockType
  level?: 2 | 3
  text?: string
  tone?: 'info' | 'warning' | 'tip'
  url?: string
  alt?: string
  caption?: string
  language?: string
  code?: string
  content_type?: 'video' | 'webinar' | 'pdf' | 'document' | 'link' | 'download'
}

function firstZodMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message || 'Invalid lesson block'
}

function lessonBlockTypeLabel(item: unknown): string {
  if (!item || typeof item !== 'object') return 'block'
  const type = (item as { type?: unknown }).type
  return typeof type === 'string' && type.trim() ? type : 'block'
}

export function newLessonBlockId(): string {
  return `blk_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function createEmptyLessonBlock(type: Phase1BlockType): EditorLessonBlock {
  const id = newLessonBlockId()
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: '' }
    case 'rich_text':
      return { id, type, text: '' }
    case 'callout':
      return { id, type, tone: 'info', text: '' }
    case 'image':
    case 'diagram':
      return { id, type, url: '', alt: '', caption: '' }
    case 'code':
      return { id, type, language: 'text', code: '' }
    case 'resource':
      return { id, type, content_type: 'link', url: '' }
  }
}

export function lessonBlocksToEditor(blocks: LessonBlock[]): EditorLessonBlock[] {
  return blocks.map((block, index) => ({
    id: block.id || `${block.type}-${index}`,
    ...block,
  }))
}

export function moveLessonBlock<T>(blocks: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction
  if (index < 0 || index >= blocks.length || next < 0 || next >= blocks.length) {
    return blocks
  }
  const copy = blocks.slice()
  const [removed] = copy.splice(index, 1)
  copy.splice(next, 0, removed)
  return copy
}

export function removeLessonBlock<T>(blocks: T[], index: number): T[] {
  if (index < 0 || index >= blocks.length) return blocks
  return blocks.filter((_, i) => i !== index)
}

/** Fail-closed authoring parse: reject the whole body if any block is invalid. */
export function validateLessonBodyForSave(
  raw: unknown
): { ok: true; blocks: LessonBlock[] } | { ok: false; error: string } {
  if (raw == null) return { ok: true, blocks: [] }

  let items: unknown[]
  if (Array.isArray(raw)) {
    items = raw
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return { ok: false, error: 'Lesson body must be an array of blocks' }
      items = parsed
    } catch {
      return { ok: false, error: 'Lesson body must be valid JSON' }
    }
  } else {
    return { ok: false, error: 'Lesson body must be an array of blocks' }
  }

  if (items.length > MAX_LESSON_BLOCKS) {
    return { ok: false, error: `A lesson can have at most ${MAX_LESSON_BLOCKS} blocks` }
  }

  const blocks: LessonBlock[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const parsed = lessonBlockSchema.safeParse(item)
    if (!parsed.success) {
      return {
        ok: false,
        error: `Block ${i + 1} (${lessonBlockTypeLabel(item)}): ${firstZodMessage(parsed.error)}`,
      }
    }
    blocks.push(parsed.data)
  }

  return { ok: true, blocks }
}

export function editorBlocksAreDirty(current: EditorLessonBlock[], initial: EditorLessonBlock[]): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial)
}

export function previewLessonBlocks(blocks: EditorLessonBlock[]): LessonBlock[] {
  return parseLessonBody(blocks)
}

export const AUTHORABLE_BLOCK_TYPES: Array<{ type: Phase1BlockType; label: string }> =
  PHASE1_BLOCK_TYPES.map((type) => ({
    type,
    label:
      type === 'rich_text'
        ? 'Explanation'
        : type === 'heading'
          ? 'Heading'
          : type === 'callout'
            ? 'Callout'
            : type === 'image'
              ? 'Image'
              : type === 'diagram'
                ? 'Diagram'
                : type === 'code'
                  ? 'Code'
                  : 'Resource',
  }))

