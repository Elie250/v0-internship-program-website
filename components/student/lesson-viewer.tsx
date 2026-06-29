'use client'

import { FileText, Link2, PlayCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentLesson } from '@/app/actions/student-learning'

function embedVideoUrl(url: string) {
  if (url.includes('youtube.com/watch')) {
    const id = new URL(url).searchParams.get('v')
    if (id) return `https://www.youtube.com/embed/${id}`
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    if (id) return `https://www.youtube.com/embed/${id}`
  }
  return url
}

export function LessonViewer({ lesson }: { lesson: StudentLesson }) {
  const icon =
    lesson.content_type === 'video' ? PlayCircle :
    lesson.content_type === 'pdf' ? FileText :
    lesson.content_type === 'download' ? Download : Link2

  const Icon = icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-[#1e3a5f]" />
          {lesson.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!lesson.content_url ? (
          <p className="text-muted-foreground text-sm">Content link not set yet.</p>
        ) : lesson.content_type === 'video' ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={embedVideoUrl(lesson.content_url)}
              title={lesson.title}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/40 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {lesson.content_type === 'pdf' ? 'PDF document' : 'Learning resource'}
            </p>
            <Button asChild className="bg-[#1e3a5f]">
              <a href={lesson.content_url} target="_blank" rel="noopener noreferrer">
                Open {lesson.content_type === 'download' ? 'download' : 'material'}
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
