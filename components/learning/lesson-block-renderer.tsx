'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { LessonBlock, StudentLessonBlock } from '@/lib/learning/lesson-blocks'
import { codeLanguageLabel } from '@/lib/learning/lesson-code-languages'
import { LESSON_RICH_TEXT_CLASSNAME, sanitizeLessonHtml } from '@/lib/learning/lesson-html'
import { renderLessonMath } from '@/lib/learning/lesson-math'
import {
  canPlayAsNativeVideo,
  embedMediaUrl,
  isPdfUrl,
  isWebinarJoinUrl,
  parseYouTubeVideoId,
  youtubePrivacyEmbedUrl,
} from '@/lib/learning/media-embed'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

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

function MathBlockView({ block }: { block: Extract<LessonBlock, { type: 'math' }> }) {
  const rendered = useMemo(
    () => renderLessonMath(block.latex, block.display === 'block'),
    [block.display, block.latex]
  )
  const display = block.display === 'block'

  if (!rendered.ok) {
    return (
      <aside
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        role="status"
      >
        {block.alt_text?.trim() || rendered.error}
      </aside>
    )
  }

  return (
    <figure
      className={cn('overflow-x-auto py-1', display && 'text-center')}
      aria-label={block.alt_text?.trim() || 'Mathematical expression'}
    >
      <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
      {block.alt_text?.trim() ? <figcaption className="sr-only">{block.alt_text}</figcaption> : null}
    </figure>
  )
}

function TableBlockView({ block }: { block: Extract<LessonBlock, { type: 'table' }> }) {
  return (
    <figure className="space-y-2">
      {block.caption?.trim() ? (
        <figcaption className="text-sm font-medium text-slate-900">{block.caption}</figcaption>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {block.headers.map((header, index) => (
                <th
                  key={`th-${index}`}
                  scope="col"
                  className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-900"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`tr-${rowIndex}`} className="odd:bg-white even:bg-slate-50/60">
                {row.map((cell, colIndex) => (
                  <td
                    key={`td-${rowIndex}-${colIndex}`}
                    className="border-b border-slate-100 px-3 py-2 text-slate-700 whitespace-pre-wrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

function ProcedureBlockView({ block }: { block: Extract<LessonBlock, { type: 'procedure' }> }) {
  // Temporary viewing state only — never persisted to disk or student progress.
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <section className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">Procedure</p>
        <h3 className="text-base font-semibold text-slate-900">{block.title}</h3>
        {block.intro?.trim() ? (
          <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{block.intro}</p>
        ) : null}
        {block.trackable ? (
          <p className="text-[11px] text-slate-500">
            Checkboxes are temporary viewing aids and reset when you leave or reload this lesson.
          </p>
        ) : null}
      </div>
      <ol className="space-y-3">
        {block.steps.map((step, index) => {
          const calloutClass =
            step.callout?.tone === 'safety'
              ? 'border-red-300 bg-red-50 text-red-950'
              : step.callout?.tone === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-950'
                : 'border-slate-200 bg-white text-slate-800'
          const calloutLabel =
            step.callout?.tone === 'safety'
              ? 'Safety'
              : step.callout?.tone === 'warning'
                ? 'Warning'
                : 'Note'

          return (
            <li key={step.id} className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-start gap-2">
                {block.trackable ? (
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(checked[step.id])}
                    onChange={(event) =>
                      setChecked((prev) => ({ ...prev, [step.id]: event.target.checked }))
                    }
                    aria-label={`Mark step ${index + 1} complete for this viewing session`}
                  />
                ) : (
                  <span className="mt-0.5 text-xs font-semibold text-slate-500 w-5 shrink-0">
                    {index + 1}.
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {!block.trackable ? null : <span className="text-slate-500 font-normal mr-1">{index + 1}.</span>}
                    {step.title}
                  </p>
                  <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                    {step.instructions}
                  </p>
                </div>
              </div>
              {step.callout ? (
                <aside className={cn('rounded-md border px-3 py-2 text-sm', calloutClass)}>
                  <p className="font-medium mb-0.5">{calloutLabel}</p>
                  <p className="whitespace-pre-wrap">{step.callout.text}</p>
                </aside>
              ) : null}
            </li>
          )
        })}
      </ol>
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
          {block.type === 'diagram' && block.title?.trim() ? (
            <p className="text-sm font-semibold text-slate-900">{block.title}</p>
          ) : null}
          <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image
              src={block.url}
              alt={
                block.alt ||
                block.caption ||
                (block.type === 'diagram' ? block.title || 'Diagram' : 'Lesson image')
              }
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
          <div className="px-3 py-1.5 text-[11px] tracking-wide text-slate-300 border-b border-slate-800">
            {codeLanguageLabel(block.language)}
          </div>
          <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-100">
            <code>{block.code}</code>
          </pre>
        </div>
      )
    case 'math':
      return <MathBlockView block={block} />
    case 'table':
      return <TableBlockView block={block} />
    case 'procedure':
      return <ProcedureBlockView block={block} />
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
