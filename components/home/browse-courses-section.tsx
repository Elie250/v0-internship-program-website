import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Briefcase, GraduationCap } from 'lucide-react'
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

const PORTALS = [
  { href: '/learning', label: 'Training', icon: GraduationCap },
  { href: '/internship', label: 'Internship', icon: Briefcase },
  { href: '/career', label: 'Career & events', icon: BookOpen },
] as const

export async function BrowseCoursesSection() {
  const courses = (await getPublishedCourses()).slice(0, 6)
  const user = await getCurrentUser()
  const isStudent = user?.role === 'student' || user?.role === 'registered'

  return (
    <section id="browse-courses" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)] mb-2">
            Programmes
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Browse all courses</h2>
          <p className="text-slate-600">
            Explore training, internships, and career programmes. Log in to enroll from your student
            account — free programmes unlock instantly; paid programmes use MTN MoMo verification.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {PORTALS.map(({ href, label, icon: Icon, track }) => (
            <Link key={href} href={href} className="no-underline hover:no-underline">
              <Card className="h-full border-slate-200 hover:border-[var(--brand-navy)]/30 hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[var(--brand-navy)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-600">View public catalogue</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {courses.map((course) => {
              const enrollPath = `/student/courses/${course.id}/enroll`
              const enrollHref = isStudent
                ? enrollPath
                : `/auth/login?redirect=${encodeURIComponent(enrollPath)}`
              const free = isFreeProgram(course.pricing)
              const type = (course.program_type ?? 'training') as ProgramType
              return (
                <Card key={course.id} className="overflow-hidden border-slate-200 flex flex-col">
                  {course.thumbnail ? (
                    <div className="relative h-36 bg-slate-100">
                      <Image src={course.thumbnail} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="h-36 bg-slate-100 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-slate-300" />
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
                    <CardTitle className="text-lg text-slate-900 leading-snug">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 gap-3">
                    <p className="text-sm text-slate-600 line-clamp-2 flex-1">{course.description}</p>
                    <p className="text-sm font-semibold text-[var(--brand-navy)]">
                      {free ? 'Free' : `${Number(course.pricing ?? 0).toLocaleString()} RWF`}
                    </p>
                    <Link href={enrollHref} className="w-full">
                      <Button size="sm" className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                        {isStudent ? (free ? 'Enroll free' : 'Enroll') : 'Log in to enroll'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : null}

        <div className="text-center">
          <Link href="/learning">
            <Button size="lg" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              Browse all courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
