import { z } from 'zod'
import { prepareRichTextFields } from './lesson-html.ts'
import { parseYouTubeVideoId } from './media-embed.ts'

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
  'youtube',
  'checkpoint',
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
  html: z.string().trim().max(MAX_BLOCK_TEXT).optional(),
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

const youtubeUrl = z
  .string()
  .trim()
  .max(2000)
  .superRefine((value, ctx) => {
    const parsed = parseYouTubeVideoId(value)
    if (!parsed.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: parsed.error })
    }
  })

export const youtubeBlockSchema = z.object({
  type: z.literal('youtube'),
  id: optionalId,
  url: youtubeUrl,
  title: z.string().trim().min(1, 'A video title is required').max(200),
  intro: z.string().trim().max(2000).optional(),
  caption: z.string().trim().max(400).optional(),
})

const checkpointChoiceSchema = z.object({
  id: z.string().trim().min(1).max(64),
  text: z.string().trim().min(1).max(400),
})

export const checkpointBlockSchema = z.object({
  type: z.literal('checkpoint'),
  id: z.string().trim().min(1).max(64),
  version: z.literal(1).default(1),
  question: z.string().trim().min(1, 'A checkpoint question is required').max(2000),
  choices: z.array(checkpointChoiceSchema).min(2, 'Add at least two choices').max(8),
  correct_choice_id: z.string().trim().min(1).max(64),
  hint: z.string().trim().min(1, 'A hint is required').max(2000),
  gate: z.enum(['section', 'lesson']).default('section'),
})

export function validateCheckpointSemantics(
  block: Extract<z.infer<typeof checkpointBlockSchema>, { type: 'checkpoint' }>
): { ok: true } | { ok: false; error: string } {
  const ids = block.choices.map((choice) => choice.id)
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'Choice IDs must be unique' }
  }
  if (!ids.includes(block.correct_choice_id)) {
    return { ok: false, error: 'The correct answer must match one of the choices' }
  }
  return { ok: true }
}

export const lessonBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  richTextBlockSchema,
  calloutBlockSchema,
  imageBlockSchema,
  diagramBlockSchema,
  codeBlockSchema,
  resourceBlockSchema,
  youtubeBlockSchema,
  checkpointBlockSchema,
])

export type LessonBlock = z.infer<typeof lessonBlockSchema>
export type CheckpointBlock = Extract<LessonBlock, { type: 'checkpoint' }>
export type StudentCheckpointBlock = Omit<CheckpointBlock, 'correct_choice_id' | 'hint'>
export type StudentLessonBlock = Exclude<LessonBlock, { type: 'checkpoint' }> | StudentCheckpointBlock

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

function prepareParsedBlock(block: LessonBlock): LessonBlock | null {
  if (block.type === 'rich_text') {
    const prepared = prepareRichTextFields(block.text, block.html)
    if (!prepared.ok) return null
    const next: Extract<LessonBlock, { type: 'rich_text' }> = {
      type: 'rich_text',
      text: prepared.text,
    }
    if (block.id) next.id = block.id
    if (prepared.html) next.html = prepared.html
    return next
  }
  if (block.type === 'youtube') {
    const youtube = parseYouTubeVideoId(block.url)
    if (!youtube.ok) return null
    const next: Extract<LessonBlock, { type: 'youtube' }> = {
      type: 'youtube',
      url: youtube.href,
      title: block.title,
    }
    if (block.id) next.id = block.id
    if (block.intro) next.intro = block.intro
    if (block.caption) next.caption = block.caption
    return next
  }
  if (block.type === 'checkpoint') {
    return validateCheckpointSemantics(block).ok ? block : null
  }
  return block
}

/** Keep valid authored blocks, including checkpoint keys. Drop unknown or invalid items. */
export function parseLessonBody(raw: unknown): LessonBlock[] {
  const items = parseJsonArray(raw).slice(0, MAX_LESSON_BLOCKS)
  const blocks: LessonBlock[] = []
  for (const item of items) {
    const parsed = lessonBlockSchema.safeParse(item)
    if (!parsed.success) continue
    const prepared = prepareParsedBlock(parsed.data)
    if (prepared) blocks.push(prepared)
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
  html?: string
  tone?: 'info' | 'warning' | 'tip'
  url?: string
  title?: string
  intro?: string
  alt?: string
  caption?: string
  language?: string
  code?: string
  content_type?: 'video' | 'webinar' | 'pdf' | 'document' | 'link' | 'download'
  question?: string
  hint?: string
  gate?: 'section' | 'lesson'
  choices?: Array<{ id: string; text: string }>
  correct_choice_id?: string
  version?: 1
}

export function newLessonChoiceId(): string {
  return `ch_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function projectLessonBlocksForStudent(blocks: LessonBlock[]): StudentLessonBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'checkpoint') return block
    return {
      type: 'checkpoint',
      id: block.id,
      version: 1,
      question: block.question,
      choices: block.choices.map((choice) => ({ id: choice.id, text: choice.text })),
      gate: block.gate,
    }
  })
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
    case 'youtube':
      return { id, type, url: '', title: '', intro: '', caption: '' }
    case 'checkpoint': {
      const first = newLessonChoiceId()
      const second = newLessonChoiceId()
      return {
        id,
        type,
        version: 1,
        question: '',
        hint: '',
        gate: 'section',
        choices: [
          { id: first, text: '' },
          { id: second, text: '' },
        ],
        correct_choice_id: first,
      }
    }
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
    if (parsed.data.type === 'rich_text') {
      const fields = prepareRichTextFields(parsed.data.text, parsed.data.html)
      if (!fields.ok) {
        return { ok: false, error: `Block ${i + 1} (rich_text): ${fields.error}` }
      }
      const next: Extract<LessonBlock, { type: 'rich_text' }> = {
        type: 'rich_text',
        text: fields.text,
      }
      if (parsed.data.id) next.id = parsed.data.id
      if (fields.html) next.html = fields.html
      blocks.push(next)
      continue
    }
    if (parsed.data.type === 'youtube') {
      const youtube = parseYouTubeVideoId(parsed.data.url)
      if (!youtube.ok) {
        return { ok: false, error: `Block ${i + 1} (youtube): ${youtube.error}` }
      }
      const next: Extract<LessonBlock, { type: 'youtube' }> = {
        type: 'youtube',
        id: parsed.data.id || newLessonBlockId(),
        url: youtube.href,
        title: parsed.data.title,
      }
      if (parsed.data.intro) next.intro = parsed.data.intro
      if (parsed.data.caption) next.caption = parsed.data.caption
      blocks.push(next)
      continue
    }
    if (parsed.data.type === 'checkpoint') {
      const semantics = validateCheckpointSemantics(parsed.data)
      if (!semantics.ok) {
        return { ok: false, error: `Block ${i + 1} (checkpoint): ${semantics.error}` }
      }
      blocks.push({
        ...parsed.data,
        id: parsed.data.id || newLessonBlockId(),
        version: 1,
      })
      continue
    }
    blocks.push(parsed.data)
  }

  return { ok: true, blocks }
}

export function editorBlocksAreDirty(current: EditorLessonBlock[], initial: EditorLessonBlock[]): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial)
}

export function previewLessonBlocks(blocks: EditorLessonBlock[]): StudentLessonBlock[] {
  return projectLessonBlocksForStudent(parseLessonBody(blocks))
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
                  : type === 'youtube'
                    ? 'YouTube'
                    : type === 'checkpoint'
                      ? 'Checkpoint'
                      : 'Resource',
  }))

