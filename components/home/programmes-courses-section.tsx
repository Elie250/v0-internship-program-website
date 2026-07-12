import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPublishedCourses } from '@/lib/platform/queries'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  isFreeProgram,
  PROGRAM_TYPE_LABELS,
  type ProgramType,
} from '@/lib/enrollment/program-types'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function ProgrammesCoursesSection() {
  const courses = (await getPublishedCourses()).slice(0, 3)
  const user = await getCurrentUser()
  const isStudent = user?.role === 'student' || user?.role === 'registered'

  if (courses.length === 0) {
    return (
      <section id="programmes" className="home-section home-section--compact home-section--muted">
        <div className="max-w-6xl mx-auto text-center">
          <HomeSectionHeader
            eyebrow="Programmes"
            title="Hands-on engineering training"
            description="New programmes are added regularly. Browse the full catalogue on the Learning page."
            className="mb-6"
          />
          <Link href="/learning">
            <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              View programmes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section id="programmes" className="home-section home-section--compact home-section--muted">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Programmes"
            title="Open for enrollment"
            description="Practitioner-led training in Kigali and online. Free programmes unlock instantly after sign-in."
            align="left"
            className="mb-0"
          />
          <Link href="/learning" className="shrink-0 text-sm font-medium text-[var(--brand-navy)] underline underline-offset-2">
            All programmes
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {courses.map((course) => {
            const enrollPath = `/student/courses/${course.id}/enroll`
            const enrollHref = isStudent
              ? enrollPath
              : `/auth/login?redirect=${encodeURIComponent(enrollPath)}`
            const free = isFreeProgram(course.pricing)
            const type = (course.program_type ?? 'training') as ProgramType
            return (
              <Card key={course.id} className="overflow-hidden border-slate-200 bg-white flex flex-col">
                {course.thumbnail ? (
                  <div className="relative h-32 bg-slate-100">
                    <Image src={course.thumbnail} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="h-32 bg-slate-100 flex items-center justify-center">
                    <BookOpen className="h-7 w-7 text-slate-300" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap gap-2 mb-1">
                    <Badge variant="outline" className="text-slate-700 border-slate-300 text-xs">
                      {PROGRAM_TYPE_LABELS[type]}
                    </Badge>
                    {free ? (
                      <Badge className="bg-green-100 text-green-900 border-green-200 text-xs">Free</Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-base text-slate-900 leading-snug">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-3 pt-0">
                  <p className="text-sm text-slate-600 line-clamp-2 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--brand-navy)]">
                      {free ? 'Free' : `${Number(course.pricing ?? 0).toLocaleString()} RWF`}
                    </p>
                    <Link href={enrollHref}>
                      <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                        {isStudent ? (free ? 'Enroll' : 'Enroll') : 'Enroll'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
