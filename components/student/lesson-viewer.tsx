'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Circle, FileText, Link2, PlayCircle, Download, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { StudentLesson } from '@/app/actions/student-learning'
import {
  canPlayAsNativeVideo,
  embedMediaUrl,
  isPdfUrl,
  isWebinarJoinUrl,
} from '@/lib/learning/media-embed'
import { MIN_LESSON_SECONDS, MIN_VIDEO_WATCH_PERCENT } from '@/lib/learning/lesson-integrity'

/** Seconds on an embedded player (YouTube/Vimeo) that count as 80% watched. */
const EMBED_VIDEO_SECONDS_FOR_CREDIT = 60

type LessonViewerProps = {
  lesson: StudentLesson
  courseId: string
  enrollmentId: string
  completed?: boolean
  onProgress?: (completed: boolean, meta?: { watchPercent: number; timeSpentSeconds: number }) => void
  onHeartbeat?: (meta: { watchPercent: number; elapsedSeconds: number }) => void
  progressSaving?: boolean
}

export function LessonViewer({
  lesson,
  courseId,
  enrollmentId,
  completed = false,
  onProgress,
  onHeartbeat,
  progressSaving = false,
}: LessonViewerProps) {
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0)
  const [watchPercent, setWatchPercent] = useState(0)
  const [progressLoaded, setProgressLoaded] = useState(false)
  const openedAt = useRef(Date.now())
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeSpentRef = useRef(0)
  const watchPercentRef = useRef(0)

  const url = lesson.content_url?.trim() ?? ''
  const isVideo = lesson.content_type === 'video'
  const embed = isVideo ? embedMediaUrl(url) : null
  const nativeVideo = Boolean(url && isVideo && canPlayAsNativeVideo(url))
  const externalVideo = Boolean(isVideo && !nativeVideo && !embed)
  const trackWatchByTime = Boolean(isVideo && !nativeVideo)

  const syncRefs = useCallback((time: number, watch: number) => {
    timeSpentRef.current = time
    watchPercentRef.current = watch
  }, [])

  const effectiveWatchPercent = trackWatchByTime
    ? Math.min(100, Math.round((timeSpentSeconds / EMBED_VIDEO_SECONDS_FOR_CREDIT) * MIN_VIDEO_WATCH_PERCENT))
    : watchPercent

  useEffect(() => {
    let cancelled = false
    setProgressLoaded(false)
    openedAt.current = Date.now()

    async function loadProgress() {
      try {
        const res = await fetch(
          `/api/student/lesson-progress?courseId=${encodeURIComponent(courseId)}&contentId=${encodeURIComponent(lesson.id)}`,
          { credentials: 'same-origin' }
        )
        const data = await res.json()
        if (!res.ok || cancelled) return
        const time = Number(data.timeSpentSeconds ?? 0)
        const watch = Number(data.watchPercent ?? 0)
        setTimeSpentSeconds(time)
        setWatchPercent(watch)
        syncRefs(time, watch)
      } catch {
        if (!cancelled) {
          setTimeSpentSeconds(0)
          setWatchPercent(0)
          syncRefs(0, 0)
        }
      } finally {
        if (!cancelled) setProgressLoaded(true)
      }
    }

    void loadProgress()
    return () => {
      cancelled = true
    }
  }, [courseId, lesson.id, syncRefs])

  const flushHeartbeat = useCallback(() => {
    if (!onHeartbeat) return
    const elapsed = Math.min(
      20,
      Math.max(1, Math.floor((Date.now() - openedAt.current) / 1000))
    )
    openedAt.current = Date.now()

    const nextTime = timeSpentRef.current + elapsed
    const nextWatch = trackWatchByTime
      ? Math.min(100, Math.round((nextTime / EMBED_VIDEO_SECONDS_FOR_CREDIT) * MIN_VIDEO_WATCH_PERCENT))
      : watchPercentRef.current

    setTimeSpentSeconds(nextTime)
    if (trackWatchByTime) {
      setWatchPercent(nextWatch)
    }
    syncRefs(nextTime, nextWatch)

    onHeartbeat({
      watchPercent: trackWatchByTime ? nextWatch : watchPercentRef.current,
      elapsedSeconds: elapsed,
    })
  }, [trackWatchByTime, onHeartbeat, syncRefs])

  useEffect(() => {
    if (!onHeartbeat || !progressLoaded) return

    const id = window.setInterval(flushHeartbeat, 5000)
    return () => window.clearInterval(id)
  }, [flushHeartbeat, onHeartbeat, progressLoaded, lesson.id])

  const updateWatchFromVideo = useCallback(() => {
    const video = videoRef.current
    if (!video?.duration || !Number.isFinite(video.duration) || video.duration <= 0) return
    const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100))
    setWatchPercent((prev) => {
      const next = Math.max(prev, pct)
      watchPercentRef.current = next
      return next
    })
  }, [])

  const canComplete =
    completed ||
    (timeSpentSeconds >= MIN_LESSON_SECONDS &&
      (!isVideo || effectiveWatchPercent >= MIN_VIDEO_WATCH_PERCENT))

  const completeHint = completed
    ? ''
    : timeSpentSeconds < MIN_LESSON_SECONDS
      ? `Stay on this lesson for ${Math.max(0, MIN_LESSON_SECONDS - timeSpentSeconds)}s more.`
      : isVideo && effectiveWatchPercent < MIN_VIDEO_WATCH_PERCENT
        ? trackWatchByTime
          ? `Keep watching — ${effectiveWatchPercent}% of required time (${MIN_VIDEO_WATCH_PERCENT}% needed).`
          : `Watch ${MIN_VIDEO_WATCH_PERCENT}% of the video (${effectiveWatchPercent}% so far).`
        : ''

  const handleMarkComplete = () => {
    if (!onProgress) return
    onProgress(true, { watchPercent: effectiveWatchPercent, timeSpentSeconds: timeSpentRef.current })
  }

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

    if (isVideo && nativeVideo) {
      const src = embed ?? url
      return (
        <div className="space-y-2">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={src}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full"
              title={lesson.title}
              onLoadedMetadata={updateWatchFromVideo}
              onTimeUpdate={updateWatchFromVideo}
              onEnded={() => {
                setWatchPercent(100)
                watchPercentRef.current = 100
              }}
            >
              Your browser does not support video playback.
            </video>
          </div>
          <Button asChild variant="outline" size="sm" className="text-slate-900 border-slate-300">
            <a href={src} target="_blank" rel="noopener noreferrer">
              Open video in new tab
            </a>
          </Button>
        </div>
      )
    }

    if (isVideo && embed) {
      return (
        <div className="space-y-2">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={embed}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-slate-500">
            Embedded video — progress is tracked by time spent watching on this page.
          </p>
          <Button asChild variant="outline" size="sm" className="text-slate-900 border-slate-300">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open on provider site
            </a>
          </Button>
        </div>
      )
    }

    if (isVideo && externalVideo) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center space-y-4">
          <p className="text-sm text-slate-700">
            This video opens on the provider&apos;s website. Watch it there — time on this lesson page counts toward completion.
          </p>
          <Button asChild size="lg" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open video
            </a>
          </Button>
        </div>
      )
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
            <div className="text-right space-y-1">
              <Button
                type="button"
                size="sm"
                variant={completed ? 'outline' : 'default'}
                disabled={progressSaving || !progressLoaded || (!completed && !canComplete)}
                className={
                  completed
                    ? 'border-green-600 text-green-800 hover:bg-green-50'
                    : 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
                }
                onClick={() => (completed ? onProgress(false) : handleMarkComplete())}
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
              {!completed && completeHint ? (
                <p className="text-xs text-slate-500 max-w-[14rem]">{completeHint}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        {!completed && isVideo && progressLoaded ? (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Watch progress</span>
              <span>{effectiveWatchPercent}%</span>
            </div>
            <Progress value={effectiveWatchPercent} className="h-1.5" />
          </div>
        ) : null}
        <p className="text-xs text-slate-500 sr-only">
          Course {courseId}, enrollment {enrollmentId}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">{renderContent()}</CardContent>
    </Card>
  )
}
