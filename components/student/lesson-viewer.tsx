'use client'

import { FileText, Link2, PlayCircle, Download, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentLesson } from '@/app/actions/student-learning'
import {
  embedMediaUrl,
  isDirectVideoFile,
  isPdfUrl,
  isWebinarJoinUrl,
} from '@/lib/learning/media-embed'

export function LessonViewer({ lesson }: { lesson: StudentLesson }) {
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
      return <p className="text-muted-foreground text-sm">Content link not set yet.</p>
    }

    if (lesson.content_type === 'webinar' || isWebinarJoinUrl(url)) {
      return (
        <div className="rounded-lg border bg-muted/40 p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Live webinar or online meeting — join when your instructor starts the session.
          </p>
          <Button asChild size="lg" className="bg-[#1e3a5f]">
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
          <div className="aspect-[4/3] rounded-lg overflow-hidden border bg-white">
            <iframe src={url} title={lesson.title} className="w-full h-full" />
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open PDF in new tab
            </a>
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-lg border bg-muted/40 p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {lesson.content_type === 'document'
            ? 'Document / slides'
            : lesson.content_type === 'download'
              ? 'Downloadable file'
              : 'Learning resource'}
        </p>
        <Button asChild className="bg-[#1e3a5f]">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open {lesson.content_type === 'download' ? 'download' : 'material'}
          </a>
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-[#1e3a5f]" />
          {lesson.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{renderContent()}</CardContent>
    </Card>
  )
}
