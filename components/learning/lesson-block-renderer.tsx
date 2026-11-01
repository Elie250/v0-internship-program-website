'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { LessonBlock, StudentLessonBlock } from '@/lib/learning/lesson-blocks'
import { LESSON_RICH_TEXT_CLASSNAME, sanitizeLessonHtml } from '@/lib/learning/lesson-html'
import {
  canPlayAsNativeVideo,
  embedMediaUrl,
  isPdfUrl,
  isWebinarJoinUrl,
  parseYouTubeVideoId,
  youtubePrivacyEmbedUrl,
} from '@/lib/learning/media-embed'
import { cn } from '@/lib/utils'

type RenderableLessonBlock = LessonBlock | StudentLessonBlock

type LessonBlockRendererProps = {
  blocks: RenderableLessonBlock[]
  className?: string
  clearedCheckpointIds?: string[]
  gateCheckpoints?: boolean
  checkpointHints?: Record<string, string>
  submittingCheckpointId?: string | null
  onSubmitCheckpoint?: (blockId: string, choiceId: string) => void
}

function hasCheckpointSecrets(
  block: RenderableLessonBlock
): block is Extract<LessonBlock, { type: 'checkpoint' }> {
  return block.type === 'checkpoint' && 'correct_choice_id' in block
}

function RichText({ text, html }: { text: string; html?: string }) {
  const sanitized = html?.trim() ? sanitizeLessonHtml(html) : { html: '', text }
  if (sanitized.html) {
    return (
      <div
        className={LESSON_RICH_TEXT_CLASSNAME}
        dangerouslySetInnerHTML={{ __html: sanitized.html }}
      />
    )
  }

  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function ResourceEmbed({ block }: { block: Extract<LessonBlock, { type: 'resource' }> }) {
  const url = block.url
  const embed = block.content_type === 'video' ? embedMediaUrl(url) : null
  const nativeVideo = block.content_type === 'video' && canPlayAsNativeVideo(url)

  if (block.content_type === 'webinar' || isWebinarJoinUrl(url)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center space-y-3">
        <p className="text-sm text-slate-700">Live session link</p>
        <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Join session
          </a>
        </Button>
      </div>
    )
  }

  if (nativeVideo) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <video src={embed ?? url} controls playsInline preload="metadata" className="w-full h-full" />
      </div>
    )
  }

  if (embed) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={embed}
          title="Embedded video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (isPdfUrl(url, block.content_type)) {
    return (
      <div className="space-y-2">
        <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white">
          <iframe src={url} title="PDF" className="w-full h-full" />
        </div>
        <Button asChild variant="outline" size="sm" className="text-slate-900 border-slate-300">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open PDF
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
      <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
        <a href={url} target="_blank" rel="noopener noreferrer">
          {block.content_type === 'download' ? 'Download material' : 'Open resource'}
        </a>
      </Button>
    </div>
  )
}

function YouTubeEmbed({ block }: { block: Extract<LessonBlock, { type: 'youtube' }> }) {
  const parsed = parseYouTubeVideoId(block.url)
  const embed = parsed.ok ? youtubePrivacyEmbedUrl(parsed.videoId) : null
  if (!embed) return null

  return (
    <figure className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{block.title}</h3>
        {block.intro?.trim() ? (
          <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{block.intro}</p>
        ) : null}
      </div>
      <div className="aspect-video overflow-hidden rounded-lg bg-black">
        <iframe
          src={embed}
          title={block.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {block.caption?.trim() ? (
        <figcaption className="text-xs text-slate-600 text-center">{block.caption}</figcaption>
      ) : null}
    </figure>
  )
}

function CheckpointView({
  block,
  passed,
  hint,
  submitting,
  onSubmit,
}: {
  block: Extract<StudentLessonBlock, { type: 'checkpoint' }>
  passed: boolean
  hint?: string
  submitting?: boolean
  onSubmit?: (choiceId: string) => void
}) {
  const [choiceId, setChoiceId] = useState(block.choices[0]?.id ?? '')

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Checkpoint</p>
      <p className="text-sm font-medium text-slate-900">{block.question}</p>
      <fieldset className="space-y-2" disabled={passed || !onSubmit || submitting}>
        <legend className="sr-only">Answer choices</legend>
        {block.choices.map((choice) => (
          <label key={choice.id} className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name={`checkpoint-${block.id}`}
              value={choice.id}
              checked={choiceId === choice.id}
              onChange={() => setChoiceId(choice.id)}
              className="mt-0.5"
            />
            <span>{choice.text}</span>
          </label>
        ))}
      </fieldset>
      {passed ? (
        <p className="text-sm text-green-800">Correct. You can continue.</p>
      ) : (
        <>
          {hint ? <p className="text-sm text-amber-900">{hint}</p> : null}
          {onSubmit ? (
            <Button
              type="button"
              size="sm"
              disabled={submitting || !choiceId}
              className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
              onClick={() => onSubmit(choiceId)}
            >
              {submitting ? 'Checking…' : 'Check answer'}
            </Button>
          ) : (
            <p className="text-xs text-slate-500">
              Students must answer this question to continue.
              {block.gate === 'lesson' ? ' Passing it is also required before the next lesson.' : ''}
            </p>
          )}
        </>
      )}
    </section>
  )
}

function BlockView({
  block,
  passed,
  hint,
  submitting,
  onSubmitCheckpoint,
}: {
  block: RenderableLessonBlock
  passed?: boolean
  hint?: string
  submitting?: boolean
  onSubmitCheckpoint?: (blockId: string, choiceId: string) => void
}) {
  switch (block.type) {
    case 'heading':
      return block.level === 3 ? (
        <h3 className="text-base font-semibold text-slate-900 pt-2">{block.text}</h3>
      ) : (
        <h2 className="text-lg font-semibold text-slate-900 pt-2">{block.text}</h2>
      )
    case 'rich_text':
      return <RichText text={block.text} html={block.html} />
    case 'callout': {
      const toneClass =
        block.tone === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-950'
          : block.tone === 'tip'
            ? 'border-teal-200 bg-teal-50 text-teal-950'
            : 'border-[var(--brand-navy)]/20 bg-[var(--brand-navy)]/5 text-slate-800'
      const label = block.tone === 'warning' ? 'Note' : block.tone === 'tip' ? 'Tip' : 'Info'
      return (
        <aside className={cn('rounded-lg border px-4 py-3 text-sm leading-6', toneClass)}>
          <p className="font-medium mb-1">{label}</p>
          <p className="whitespace-pre-wrap">{block.text}</p>
        </aside>
      )
    }
    case 'image':
    case 'diagram':
      return (
        <figure className="space-y-2">
          <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image
              src={block.url}
              alt={block.alt || block.caption || (block.type === 'diagram' ? 'Diagram' : 'Lesson image')}
              width={1280}
              height={720}
              className="w-full h-auto"
              unoptimized
            />
          </div>
          {block.caption ? (
            <figcaption className="text-xs text-slate-600 text-center">{block.caption}</figcaption>
          ) : null}
        </figure>
      )
    case 'code':
      return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-slate-300 border-b border-slate-800">
            {block.language || 'text'}
          </div>
          <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-100">
            <code>{block.code}</code>
          </pre>
        </div>
      )
    case 'resource':
      return <ResourceEmbed block={block} />
    case 'youtube':
      return <YouTubeEmbed block={block} />
    case 'checkpoint': {
      const studentBlock = hasCheckpointSecrets(block)
        ? {
            type: 'checkpoint' as const,
            id: block.id,
            version: 1 as const,
            question: block.question,
            choices: block.choices.map((choice) => ({ id: choice.id, text: choice.text })),
            gate: block.gate,
          }
        : block
      return (
        <CheckpointView
          block={studentBlock}
          passed={Boolean(passed)}
          hint={hint}
          submitting={submitting}
          onSubmit={
            onSubmitCheckpoint && studentBlock.id
              ? (choiceId) => onSubmitCheckpoint(studentBlock.id, choiceId)
              : undefined
          }
        />
      )
    }
    default:
      return null
  }
}

export function LessonBlockRenderer({
  blocks,
  className,
  clearedCheckpointIds = [],
  gateCheckpoints = false,
  checkpointHints,
  submittingCheckpointId,
  onSubmitCheckpoint,
}: LessonBlockRendererProps) {
  if (!blocks.length) return null

  const cleared = new Set(clearedCheckpointIds)
  const visible: RenderableLessonBlock[] = []
  for (const block of blocks) {
    visible.push(block)
    if (gateCheckpoints && block.type === 'checkpoint' && !cleared.has(block.id)) {
      break
    }
  }

  return (
    <div className={cn('space-y-5', className)}>
      {visible.map((block, index) => (
        <BlockView
          key={block.id || `${block.type}-${index}`}
          block={block}
          passed={block.type === 'checkpoint' ? cleared.has(block.id) : false}
          hint={block.type === 'checkpoint' ? checkpointHints?.[block.id] : undefined}
          submitting={block.type === 'checkpoint' && submittingCheckpointId === block.id}
          onSubmitCheckpoint={onSubmitCheckpoint}
        />
      ))}
    </div>
  )
}
