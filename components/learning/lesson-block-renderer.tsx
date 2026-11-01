import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { LessonBlock } from '@/lib/learning/lesson-blocks'
import {
  canPlayAsNativeVideo,
  embedMediaUrl,
  isPdfUrl,
  isWebinarJoinUrl,
} from '@/lib/learning/media-embed'
import { cn } from '@/lib/utils'

type LessonBlockRendererProps = {
  blocks: LessonBlock[]
  className?: string
}

function RichText({ text }: { text: string }) {
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

function BlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'heading':
      return block.level === 3 ? (
        <h3 className="text-base font-semibold text-slate-900 pt-2">{block.text}</h3>
      ) : (
        <h2 className="text-lg font-semibold text-slate-900 pt-2">{block.text}</h2>
      )
    case 'rich_text':
      return <RichText text={block.text} />
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
    default:
      return null
  }
}

export function LessonBlockRenderer({ blocks, className }: LessonBlockRendererProps) {
  if (!blocks.length) return null

  return (
    <div className={cn('space-y-5', className)}>
      {blocks.map((block, index) => (
        <BlockView key={block.id || `${block.type}-${index}`} block={block} />
      ))}
    </div>
  )
}
