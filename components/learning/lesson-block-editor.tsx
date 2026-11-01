'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { COURSE_CONTENT_TYPES } from '@/lib/learning/course-content-types'
import {
  AUTHORABLE_BLOCK_TYPES,
  createEmptyLessonBlock,
  moveLessonBlock,
  removeLessonBlock,
  type EditorLessonBlock,
} from '@/lib/learning/lesson-authoring'
import type { Phase1BlockType } from '@/lib/learning/lesson-blocks'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'

type LessonBlockEditorProps = {
  blocks: EditorLessonBlock[]
  onChange: (blocks: EditorLessonBlock[]) => void
  onUploadFile?: (file: File) => Promise<string>
  disabled?: boolean
}

const BLOCK_TONE: Record<Phase1BlockType, string> = {
  heading: 'border-l-[var(--brand-navy)] bg-white',
  rich_text: 'border-l-slate-400 bg-white',
  callout: 'border-l-amber-500 bg-amber-50/40',
  image: 'border-l-sky-500 bg-sky-50/40',
  diagram: 'border-l-violet-500 bg-violet-50/40',
  code: 'border-l-slate-800 bg-slate-50',
  resource: 'border-l-emerald-600 bg-emerald-50/30',
}

const BLOCK_LABEL: Record<Phase1BlockType, string> = {
  heading: 'Heading',
  rich_text: 'Explanation',
  callout: 'Callout',
  image: 'Image',
  diagram: 'Diagram',
  code: 'Code',
  resource: 'Resource',
}

function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || /\.svgz?$/i.test(file.name)
}

export function LessonBlockEditor({
  blocks,
  onChange,
  onUploadFile,
  disabled = false,
}: LessonBlockEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')

  const updateBlock = (index: number, patch: Partial<EditorLessonBlock>) => {
    onChange(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)))
  }

  const handleUpload = async (index: number, file: File) => {
    if (!onUploadFile) return
    if (isSvgFile(file)) {
      setUploadError('SVG files are not allowed for images or diagrams.')
      return
    }
    setUploadingIndex(index)
    setUploadError('')
    try {
      const url = await onUploadFile(file)
      updateBlock(index, { url })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {AUTHORABLE_BLOCK_TYPES.map((option) => (
          <Button
            key={option.type}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 border-slate-300 text-slate-700"
            onClick={() => onChange([...blocks, createEmptyLessonBlock(option.type)])}
          >
            <Plus className="h-3.5 w-3.5" />
            {option.label}
          </Button>
        ))}
      </div>

      {uploadError ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {uploadError}
        </p>
      ) : null}

      {blocks.length === 0 ? (
        <p className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-md px-3 py-6 text-center">
          Add a heading, explanation, diagram, or code block to start this lesson.
        </p>
      ) : (
        <ol className="space-y-3">
          {blocks.map((block, index) => (
            <li
              key={block.id}
              className={cn('rounded-md border border-slate-200 border-l-4 p-3 space-y-3', BLOCK_TONE[block.type])}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {BLOCK_LABEL[block.type]}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === 0}
                    onClick={() => onChange(moveLessonBlock(blocks, index, -1))}
                    aria-label="Move block up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === blocks.length - 1}
                    onClick={() => onChange(moveLessonBlock(blocks, index, 1))}
                    aria-label="Move block down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onChange(removeLessonBlock(blocks, index))}
                    aria-label="Delete block"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {block.type === 'heading' ? (
                <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                  <div>
                    <Label>Level</Label>
                    <Select
                      value={String(block.level ?? 2)}
                      onValueChange={(value) =>
                        updateBlock(index, { level: Number(value) === 3 ? 3 : 2 })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Heading 2</SelectItem>
                        <SelectItem value="3">Heading 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Text</Label>
                    <Input
                      className="mt-1"
                      value={block.text ?? ''}
                      disabled={disabled}
                      onChange={(event) => updateBlock(index, { text: event.target.value })}
                      placeholder="Lesson section title"
                    />
                  </div>
                </div>
              ) : null}

              {block.type === 'rich_text' ? (
                <div>
                  <Label>Explanation</Label>
                  <Textarea
                    className="mt-1 min-h-28"
                    value={block.text ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateBlock(index, { text: event.target.value })}
                    placeholder="Write the explanation students will read."
                  />
                </div>
              ) : null}

              {block.type === 'callout' ? (
                <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                  <div>
                    <Label>Tone</Label>
                    <Select
                      value={block.tone ?? 'info'}
                      onValueChange={(value) =>
                        updateBlock(index, { tone: value as EditorLessonBlock['tone'] })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="tip">Tip</SelectItem>
                        <SelectItem value="warning">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Text</Label>
                    <Textarea
                      className="mt-1"
                      value={block.text ?? ''}
                      disabled={disabled}
                      onChange={(event) => updateBlock(index, { text: event.target.value })}
                      placeholder="A short teaching note"
                    />
                  </div>
                </div>
              ) : null}

              {block.type === 'image' || block.type === 'diagram' ? (
                <div className="space-y-3">
                  <div>
                    <Label>HTTPS image URL</Label>
                    <Input
                      className="mt-1"
                      value={block.url ?? ''}
                      disabled={disabled}
                      onChange={(event) => updateBlock(index, { url: event.target.value })}
                      placeholder="https://media.energyandlogics.com/..."
                    />
                  </div>
                  {onUploadFile ? (
                    <div>
                      <Label>Or upload {block.type === 'diagram' ? 'a diagram' : 'an image'}</Label>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={disabled || uploadingIndex === index}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) void handleUpload(index, file)
                            event.target.value = ''
                          }}
                        />
                        {uploadingIndex === index ? (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Upload className="h-3 w-3" /> JPG, PNG, WebP, or GIF — SVG is not allowed
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Alt text</Label>
                      <Input
                        className="mt-1"
                        value={block.alt ?? ''}
                        disabled={disabled}
                        onChange={(event) => updateBlock(index, { alt: event.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Caption</Label>
                      <Input
                        className="mt-1"
                        value={block.caption ?? ''}
                        disabled={disabled}
                        onChange={(event) => updateBlock(index, { caption: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {block.type === 'code' ? (
                <div className="space-y-3">
                  <div className="max-w-[12rem]">
                    <Label>Language</Label>
                    <Input
                      className="mt-1"
                      value={block.language ?? 'text'}
                      disabled={disabled}
                      onChange={(event) => updateBlock(index, { language: event.target.value })}
                      placeholder="iecst, python, text"
                    />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Textarea
                      className="mt-1 min-h-36 font-mono text-sm"
                      value={block.code ?? ''}
                      disabled={disabled}
                      onChange={(event) => updateBlock(index, { code: event.target.value })}
                      placeholder="IF I0.0 THEN Q0.0 := TRUE; END_IF;"
                    />
                  </div>
                </div>
              ) : null}

              {block.type === 'resource' ? (
                <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                  <div>
                    <Label>Resource type</Label>
                    <Select
                      value={block.content_type ?? 'link'}
                      onValueChange={(value) =>
                        updateBlock(index, {
                          content_type: value as EditorLessonBlock['content_type'],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_CONTENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>HTTPS URL</Label>
                    <Input
                      className="mt-1"
                      value={block.url ?? ''}
                      disabled={disabled}
                      onChange={(event) => updateBlock(index, { url: event.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
