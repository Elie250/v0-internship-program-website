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
import { RichTextBlockEditor } from '@/components/learning/rich-text-block-editor'
import { COURSE_CONTENT_TYPES } from '@/lib/learning/course-content-types'
import {
  AUTHORABLE_BLOCK_TYPES,
  createEmptyLessonBlock,
  moveLessonBlock,
  removeLessonBlock,
  type EditorLessonBlock,
} from '@/lib/learning/lesson-authoring'
import { newLessonChoiceId, type Phase1BlockType } from '@/lib/learning/lesson-blocks'
import { parseYouTubeVideoId, youtubePrivacyEmbedUrl } from '@/lib/learning/media-embed'
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
  youtube: 'border-l-red-600 bg-red-50/30',
  checkpoint: 'border-l-amber-600 bg-amber-50/30',
}

const BLOCK_LABEL: Record<Phase1BlockType, string> = {
  heading: 'Heading',
  rich_text: 'Explanation',
  callout: 'Callout',
  image: 'Image',
  diagram: 'Diagram',
  code: 'Code',
  resource: 'Resource',
  youtube: 'YouTube',
  checkpoint: 'Checkpoint',
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
                  <div className="mt-1">
                    <RichTextBlockEditor
                      text={block.text ?? ''}
                      html={block.html}
                      disabled={disabled}
                      onChange={(next) => updateBlock(index, next)}
                    />
                  </div>
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

              {block.type === 'checkpoint' ? (
                <CheckpointBlockFields
                  block={block}
                  disabled={disabled}
                  onChange={(patch) => updateBlock(index, patch)}
                />
              ) : null}

              {block.type === 'youtube' ? (
                <YouTubeBlockFields
                  block={block}
                  disabled={disabled}
                  onChange={(patch) => updateBlock(index, patch)}
                />
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

function YouTubeBlockFields({
  block,
  disabled,
  onChange,
}: {
  block: EditorLessonBlock
  disabled?: boolean
  onChange: (patch: Partial<EditorLessonBlock>) => void
}) {
  const parsed = block.url?.trim() ? parseYouTubeVideoId(block.url) : null
  const embed = parsed?.ok ? youtubePrivacyEmbedUrl(parsed.videoId) : null
  const urlError = parsed && !parsed.ok ? parsed.error : ''
  const titleMissing = !(block.title ?? '').trim()

  return (
    <div className="space-y-3">
      <div>
        <Label>YouTube URL</Label>
        <Input
          className="mt-1"
          value={block.url ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ url: event.target.value })}
          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
        />
        {urlError ? <p className="mt-1 text-xs text-red-700">{urlError}</p> : null}
      </div>
      <div>
        <Label>Title</Label>
        <Input
          className="mt-1"
          value={block.title ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="What students should watch"
        />
        {titleMissing ? (
          <p className="mt-1 text-xs text-slate-500">A title is required before this lesson can be saved.</p>
        ) : null}
      </div>
      <div>
        <Label>Introduction (optional)</Label>
        <Textarea
          className="mt-1"
          value={block.intro ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ intro: event.target.value })}
          placeholder="Explain the video before students watch it."
        />
      </div>
      <div>
        <Label>Caption (optional)</Label>
        <Input
          className="mt-1"
          value={block.caption ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ caption: event.target.value })}
          placeholder="Short note under the player"
        />
      </div>
      {embed ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
          {block.intro?.trim() ? (
            <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{block.intro}</p>
          ) : null}
          <p className="text-sm font-medium text-slate-900">{block.title?.trim() || 'YouTube preview'}</p>
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <iframe
              src={embed}
              title={block.title?.trim() || 'YouTube preview'}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {block.caption?.trim() ? (
            <p className="text-xs text-slate-600 text-center">{block.caption}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function CheckpointBlockFields({
  block,
  disabled,
  onChange,
}: {
  block: EditorLessonBlock
  disabled?: boolean
  onChange: (patch: Partial<EditorLessonBlock>) => void
}) {
  const choices = block.choices?.length
    ? block.choices
    : [
        { id: newLessonChoiceId(), text: '' },
        { id: newLessonChoiceId(), text: '' },
      ]
  const correctId = block.correct_choice_id || choices[0]?.id || ''

  const updateChoice = (index: number, text: string) => {
    onChange({
      choices: choices.map((choice, i) => (i === index ? { ...choice, text } : choice)),
      correct_choice_id: correctId,
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Question</Label>
        <Textarea
          className="mt-1"
          value={block.question ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ question: event.target.value })}
          placeholder="What must the student understand before continuing?"
        />
      </div>
      <div className="space-y-2">
        <Label>Answers</Label>
        {choices.map((choice, index) => (
          <div key={choice.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`checkpoint-correct-${block.id}`}
              checked={correctId === choice.id}
              disabled={disabled}
              onChange={() => onChange({ correct_choice_id: choice.id, choices })}
              aria-label={`Mark choice ${index + 1} as correct`}
            />
            <Input
              value={choice.text}
              disabled={disabled}
              onChange={(event) => updateChoice(index, event.target.value)}
              placeholder={`Choice ${index + 1}`}
            />
            {choices.length > 2 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  const next = choices.filter((_, i) => i !== index)
                  onChange({
                    choices: next,
                    correct_choice_id: next.some((item) => item.id === correctId)
                      ? correctId
                      : next[0]?.id,
                  })
                }}
                aria-label={`Remove choice ${index + 1}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        ))}
        {choices.length < 8 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="border-slate-300 text-slate-700"
            onClick={() =>
              onChange({
                choices: [...choices, { id: newLessonChoiceId(), text: '' }],
                correct_choice_id: correctId,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add choice
          </Button>
        ) : null}
        <p className="text-xs text-slate-500">Select the radio button beside the correct answer.</p>
      </div>
      <div>
        <Label>Hint after a wrong answer</Label>
        <Textarea
          className="mt-1"
          value={block.hint ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ hint: event.target.value })}
          placeholder="Help the student try again without revealing the answer."
        />
      </div>
      <div>
        <Label>Unlock rule</Label>
        <Select
          value={block.gate ?? 'section'}
          onValueChange={(value) => onChange({ gate: value === 'lesson' ? 'lesson' : 'section' })}
          disabled={disabled}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="section">
              Section — students must pass before seeing the rest of this lesson
            </SelectItem>
            <SelectItem value="lesson">
              Lesson — students must pass before seeing the rest of this lesson and before the next lesson
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
