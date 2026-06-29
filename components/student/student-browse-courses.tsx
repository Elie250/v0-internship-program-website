'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Clock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CatalogCourseItem, EnrollEligibility } from '@/app/actions/student-learning'

export function StudentBrowseCourses({
  courses,
  enrollEligibility,
  heading = 'Browse programmes',
}: {
  courses: CatalogCourseItem[]
  enrollEligibility: EnrollEligibility
  heading?: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
        <p className="text-slate-600 mt-1 text-sm">
          Enroll in one programme at a time. Free programmes unlock instantly; paid programmes need MoMo
          verification.
        </p>
      </div>

      {!enrollEligibility.canEnroll && enrollEligibility.reason ? (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Info className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
          <p>{enrollEligibility.reason}</p>
        </div>
      ) : null}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-600">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No published courses yet. Check back soon or contact us for upcoming cohorts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col shadow-sm border-slate-200">
              {course.thumbnail ? (
                <div className="relative h-40 bg-slate-100">
                  <Image src={course.thumbnail} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="h-40 bg-slate-100 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-slate-300" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-slate-700 border-slate-300">
                    {course.programTypeLabel}
                  </Badge>
                  {course.isFree ? (
                    <Badge className="bg-green-100 text-green-900 border-green-200">Free</Badge>
                  ) : null}
                </div>
                {course.categoryName ? (
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {course.categoryName}
                  </p>
                ) : null}
                <CardTitle className="text-lg leading-snug text-slate-900">{course.title}</CardTitle>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  {course.difficulty ? <span>{course.difficulty}</span> : null}
                  {course.duration ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-3">
                <p className="text-sm text-slate-600 line-clamp-3 flex-1">{course.description}</p>
                <p className="text-base font-bold text-[var(--brand-navy)]">
                  {course.isFree
                    ? 'Free'
                    : Number(course.pricing ?? 0) > 0
                      ? `${Number(course.pricing).toLocaleString()} RWF`
                      : 'Pricing on request'}
                </p>
                {course.scheduledAt ? (
                  <p className="text-xs text-slate-600">
                    {new Date(course.scheduledAt).toLocaleString()}
                    {course.location ? ` · ${course.location}` : ''}
                  </p>
                ) : null}
                {course.statusNote ? (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5">
                    {course.statusNote}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  {course.action === 'pending' ? (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-200">Pending</Badge>
                  ) : null}
                  {course.action === 'open' && course.actionHref ? (
                    <Link href={course.actionHref} className="w-full">
                      <Button className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                        {course.actionLabel}
                      </Button>
                    </Link>
                  ) : course.actionHref ? (
                    <Link href={course.actionHref} className="w-full">
                      <Button
                        className={
                          course.action === 'retry'
                            ? 'w-full'
                            : 'w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
                        }
                        variant={course.action === 'retry' ? 'outline' : 'default'}
                        disabled={course.action === 'disabled'}
                      >
                        {course.actionLabel}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      {course.actionLabel}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
