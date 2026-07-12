import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Cpu, Factory, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TRAINING_PROGRAMS } from '@/lib/company/constants'
import { getPublishedCourses } from '@/lib/platform/queries'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  isFreeProgram,
  PROGRAM_TYPE_LABELS,
  type ProgramType,
} from '@/lib/enrollment/program-types'
import { HomeSectionHeader } from '@/components/home/home-section-header'

const PILLAR_ICONS = [Cpu, Factory, Zap] as const

export async function ProgrammesCoursesSection() {
  const courses = (await getPublishedCourses()).slice(0, 6)
  const user = await getCurrentUser()
  const isStudent = user?.role === 'student' || user?.role === 'registered'

  return (
    <section id="programmes" className="home-section home-section--muted">
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow="Programmes & courses"
          title="Built for real engineering work"
          description="Practitioner-led training in Rwanda with online options for regional learners. Browse pillars below, then enroll from your student account — free programmes unlock instantly."
        />

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {TRAINING_PROGRAMS.map((program, index) => {
            const Icon = PILLAR_ICONS[index] ?? Cpu
            return (
              <Card key={program.id} className="flex flex-col h-full border-slate-200 bg-white">
                <CardHeader>
                  <div className="w-11 h-11 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-[var(--brand-navy)]" />
                  </div>
                  <CardTitle className="text-xl text-slate-900">{program.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <p className="text-sm text-slate-600">{program.summary}</p>
                  <ul className="text-sm space-y-1.5 flex-1">
                    {program.topics.map((topic) => (
                      <li key={topic} className="text-slate-700">
                        · {topic}
                      </li>
                    ))}
                  </ul>
                  <Link href={program.href}>
                    <Button variant="outline" className="w-full group text-slate-800 border-slate-300">
                      View programme
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {courses.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
              Open for enrollment
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
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
                          <Badge className="bg-green-100 text-green-900 border-green-200 text-xs">
                            Free
                          </Badge>
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
                        <Button
                          size="sm"
                          className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                        >
                          {isStudent ? (free ? 'Enroll free' : 'Enroll') : 'Log in to enroll'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : null}

        <div className="text-center">
          <Link href="/learning">
            <Button size="lg" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              Browse all programmes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
