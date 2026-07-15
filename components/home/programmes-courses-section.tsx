import Link from 'next/link'
import { getPublishedCourses } from '@/lib/platform/queries'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  isFreeProgram,
  PROGRAM_TYPE_LABELS,
  type ProgramType,
} from '@/lib/enrollment/program-types'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import {
  SectionShuffleSlots,
  type ShuffleCardItem,
} from '@/components/home/section-shuffle-slots'

export async function ProgrammesCoursesSection() {
  const courses = await getPublishedCourses()
  const user = await getCurrentUser()
  const isStudent = user?.role === 'student' || user?.role === 'registered'

  const items: ShuffleCardItem[] = courses.slice(0, 24).map((course) => {
    const enrollPath = `/student/courses/${course.id}/enroll`
    const enrollHref = isStudent
      ? enrollPath
      : `/auth/login?redirect=${encodeURIComponent(enrollPath)}`
    const free = isFreeProgram(course.pricing)
    const type = (course.program_type ?? 'training') as ProgramType
    return {
      id: course.id,
      title: course.title,
      subtitle: course.description || undefined,
      href: enrollHref,
      imageUrl: course.thumbnail || null,
      badge: PROGRAM_TYPE_LABELS[type],
      ctaLabel: free ? 'Free · Enroll' : `${Number(course.pricing ?? 0).toLocaleString()} RWF · Enroll`,
    }
  })

  return (
    <section id="programmes" className="home-section home-section--compact home-section--muted">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Programmes"
            title="Open for enrollment"
            description="Practitioner-led programmes in Kigali and online — enroll when a seat opens."
            align="left"
            className="mb-0"
          />
          <Link
            href="/learning"
            className="shrink-0 text-sm font-medium text-[var(--brand-navy)] underline underline-offset-2"
          >
            All programmes
          </Link>
        </div>
        <SectionShuffleSlots
          items={items}
          slots={3}
          emptyLabel="New programmes are added regularly. Browse the full catalogue on Learning."
        />
      </div>
    </section>
  )
}
