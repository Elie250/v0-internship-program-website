'use client'

import { CheckCircle2, Circle, FileText, Link2, PlayCircle, Download, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentLesson } from '@/app/actions/student-learning'
import {
  embedMediaUrl,
  isDirectVideoFile,
  isPdfUrl,
  isWebinarJoinUrl,
} from '@/lib/learning/media-embed'

type LessonViewerProps = {
  lesson: StudentLesson
  courseId: string
  enrollmentId: string
  completed?: boolean
  onProgress?: (completed: boolean) => void
  progressSaving?: boolean
}

export function LessonViewer({
  lesson,
  courseId,
  enrollmentId,
  completed = false,
  onProgress,
  progressSaving = false,
}: LessonViewerProps) {
  const icon =
    lesson.content_type === 'video'
      ? PlayCircle
      : lesson.content_type === 'webinar'
        ? Radio
        : lesson.content_type === 'pdf'
          ? FileText
          : lesson.content_type === 'download'
            ? Download
            : Link2

  const Icon = icon
  const url = lesson.content_url?.trim() ?? ''

  const renderContent = () => {
    if (!url) {
      return <p className="text-sm text-slate-600">Content link not set yet.</p>
    }

    if (lesson.content_type === 'webinar' || isWebinarJoinUrl(url)) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center space-y-4">
          <p className="text-sm text-slate-700">
            Live webinar or online meeting — join when your instructor starts the session.
          </p>
          <Button asChild size="lg" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Join webinar
            </a>
          </Button>
        </div>
      )
    }

    if (lesson.content_type === 'video') {
      const embed = embedMediaUrl(url)
      if (embed && isDirectVideoFile(embed)) {
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video src={embed} controls className="w-full h-full" title={lesson.title}>
              Your browser does not support video playback.
            </video>
          </div>
        )
      }
      if (embed) {
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={embed}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
    }

    if (isPdfUrl(url, lesson.content_type)) {
      return (
        <div className="space-y-3">
          <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white">
            <iframe src={url} title={lesson.title} className="w-full h-full" />
          </div>
          <Button asChild variant="outline" size="sm" className="text-slate-900 border-slate-300">
            <a href={url} target="_blank" rel="noopener noreferrer" download>
              Download / open PDF
            </a>
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
        <p className="text-sm text-slate-700">
          {lesson.content_type === 'document'
            ? 'Document / slides'
            : lesson.content_type === 'download'
              ? 'Downloadable file'
              : 'Learning resource'}
        </p>
        <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
          <a href={url} target="_blank" rel="noopener noreferrer" download={lesson.content_type === 'download'}>
            {lesson.content_type === 'download' ? 'Download material' : 'Open material'}
          </a>
        </Button>
      </div>
    )
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <Icon className="h-5 w-5 text-[var(--brand-navy)] shrink-0" />
            {lesson.title}
          </CardTitle>
          {onProgress ? (
            <Button
              type="button"
              size="sm"
              variant={completed ? 'outline' : 'default'}
              disabled={progressSaving}
              className={
                completed
                  ? 'border-green-600 text-green-800 hover:bg-green-50'
                  : 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
              }
              onClick={() => onProgress(!completed)}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-1.5" />
                  Mark complete
                </>
              )}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-slate-500 sr-only">
          Course {courseId}, enrollment {enrollmentId}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">{renderContent()}</CardContent>
    </Card>
  )
}
