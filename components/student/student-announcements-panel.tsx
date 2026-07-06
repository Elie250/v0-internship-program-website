'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { StudentAnnouncementFeed, StudentFeedItem } from '@/lib/learning/student-announcement-feed'
import { CalendarClock, ExternalLink, Megaphone, Radio, Video } from 'lucide-react'

const KIND_LABELS: Record<StudentFeedItem['kind'], string> = {
  platform: 'Platform',
  programme: 'Programme',
  session: 'Live session',
  webinar: 'Webinar',
}

const KIND_BADGE: Record<StudentFeedItem['kind'], string> = {
  platform: 'bg-slate-100 text-slate-800',
  programme: 'bg-emerald-100 text-emerald-800',
  session: 'bg-blue-100 text-blue-800',
  webinar: 'bg-violet-100 text-violet-800',
}

function FeedSection({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string
  icon: ReactNode
  items: StudentFeedItem[]
  emptyText?: string
}) {
  if (items.length === 0) {
    return emptyText ? (
      <p className="text-sm text-slate-500 py-2">{emptyText}</p>
    ) : null
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <FeedCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  )
}

function FeedCard({ item }: { item: StudentFeedItem }) {
  const when = item.scheduled_at ?? item.created_at
  const isSession = item.kind === 'session' || item.kind === 'webinar'

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={KIND_BADGE[item.kind]}>{KIND_LABELS[item.kind]}</Badge>
          <span className="text-xs text-slate-500">{item.creatorLabel}</span>
        </div>
        <CardTitle className="text-base text-slate-900">{item.title}</CardTitle>
        <p className="text-xs text-slate-600">
          {isSession && item.scheduled_at
            ? new Date(item.scheduled_at).toLocaleString()
            : new Date(when).toLocaleString()}
          {item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}
          {item.location ? ` · ${item.location}` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {item.message ? (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-xs">
          {item.courseId && item.kind !== 'platform' ? (
            <Link
              href={`/student/courses/${item.courseId}`}
              className="font-medium text-[var(--brand-navy)] underline underline-offset-2"
            >
              Open programme{item.courseTitle ? `: ${item.courseTitle}` : ''}
            </Link>
          ) : null}
          {item.meeting_link ? (
            <a
              href={item.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[var(--brand-navy)] underline underline-offset-2"
            >
              Join {item.kind === 'webinar' ? 'webinar' : 'session'}{' '}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {item.recording_url ? (
            <a
              href={item.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[var(--brand-navy)] underline underline-offset-2"
            >
              Watch recording <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function StudentAnnouncementsPanel({ feed }: { feed: StudentAnnouncementFeed }) {
  const hasContent =
    feed.platform.length > 0 ||
    feed.programme.length > 0 ||
    feed.sessions.length > 0 ||
    feed.webinars.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Announcements &amp; live sessions</h2>
        <p className="text-sm text-slate-600 mt-1">
          Platform news from admin and lecturers, plus updates and scheduled sessions for your
          programmes.
        </p>
      </div>

      {!hasContent ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-600 space-y-2">
            <Megaphone className="h-10 w-10 mx-auto text-slate-300" />
            <p>No announcements or upcoming sessions yet.</p>
            <p className="text-sm">Check back here for class updates and live session links.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {feed.sessions.length > 0 ? (
            <FeedSection
              title="Upcoming live sessions"
              icon={<CalendarClock className="h-4 w-4" />}
              items={feed.sessions}
            />
          ) : null}

          {feed.webinars.length > 0 ? (
            <FeedSection
              title="Upcoming webinars"
              icon={<Video className="h-4 w-4" />}
              items={feed.webinars}
            />
          ) : null}

          {feed.platform.length > 0 ? (
            <FeedSection
              title="Platform announcements"
              icon={<Radio className="h-4 w-4" />}
              items={feed.platform}
            />
          ) : null}

          {feed.programme.length > 0 ? (
            <FeedSection
              title="Your programme updates"
              icon={<Megaphone className="h-4 w-4" />}
              items={feed.programme}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
