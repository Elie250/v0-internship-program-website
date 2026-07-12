import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPublishedCourses } from '@/lib/platform/queries'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  CAREER_PROGRAM_TYPES,
  PROGRAM_TYPE_LABELS,
  type ProgramType,
} from '@/lib/enrollment/program-types'
import { MentorRequestForm } from '@/components/career/mentor-request-form'
import { isFreeProgram } from '@/lib/enrollment/program-types'

const MODULES = [
  { id: 'guidance', label: 'Career guidance', type: 'career_guidance' as ProgramType },
  { id: 'mentorship', label: 'Mentorship', type: 'mentorship' as ProgramType },
  { id: 'workshops', label: 'Workshops', type: 'workshop' as ProgramType },
  { id: 'webinars', label: 'Webinars', type: 'webinar' as ProgramType },
  { id: 'events', label: 'Events', type: 'event' as ProgramType },
]

export default async function CareerPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>
}) {
  const params = await searchParams
  const moduleId = params.module ?? 'guidance'
  const activeModule = MODULES.find((m) => m.id === moduleId) ?? MODULES[0]
  const user = await getCurrentUser()
  const isStudent = user?.role === 'student' || user?.role === 'registered'

  const programs = await getPublishedCourses(undefined, {
    programTypes: CAREER_PROGRAM_TYPES,
  })
  const filtered = programs.filter((p) => p.program_type === activeModule.type)

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-white">Career Portal</h1>
          <p className="text-white/85">
            Mentorship, career guidance, workshops, public webinars, and events — managed by administrators.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {MODULES.map((m) => (
            <Link key={m.id} href={`/career?module=${m.id}`}>
              <Button variant={moduleId === m.id ? 'default' : 'outline'} className="text-slate-900">
                {m.label}
              </Button>
            </Link>
          ))}
        </div>

        <p className="text-sm text-slate-600 mb-6">
          {isStudent ? (
            <>
              Enroll from your{' '}
              <Link href={`/student/courses?track=career&type=${activeModule.type}`} className="text-[var(--brand-navy)] font-medium underline">
                student portal
              </Link>
              . Free programmes unlock instantly; paid programmes require MoMo approval.
            </>
          ) : (
            <>
              <Link href={`/auth/login?redirect=${encodeURIComponent(`/student/courses?track=career&type=${activeModule.type}`)}`} className="text-[var(--brand-navy)] font-medium underline">
                Log in
              </Link>{' '}
              to enroll. Free programmes need no payment; paid programmes are verified by admin.
            </>
          )}
        </p>

        {moduleId === 'mentorship' ? (
          <div className="mb-8">
            <MentorRequestForm />
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-slate-600">
              No published {activeModule.label.toLowerCase()} programmes yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const enrollPath = `/student/courses/${item.id}/enroll`
              const enrollHref = isStudent
                ? enrollPath
                : `/auth/login?redirect=${encodeURIComponent(enrollPath)}`
              const free = isFreeProgram(item.pricing)
              return (
                <Card key={item.id} className="border-slate-200">
                  <CardHeader>
                    <p className="text-xs font-medium text-slate-500 uppercase">{PROGRAM_TYPE_LABELS[item.program_type ?? 'career_guidance']}</p>
                    <CardTitle className="text-slate-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600">{item.description}</p>
                    {item.scheduled_at ? (
                      <p className="text-xs text-slate-600">{new Date(item.scheduled_at).toLocaleString()}</p>
                    ) : null}
                    {item.location ? <p className="text-xs text-slate-600">{item.location}</p> : null}
                    <p className="text-sm font-semibold text-[var(--brand-navy)]">
                      {free ? 'Free' : `${Number(item.pricing ?? 0).toLocaleString()} RWF`}
                    </p>
                    <Link href={enrollHref}>
                      <Button size="sm" className="bg-[var(--brand-navy)] text-white">
                        {isStudent ? (free ? 'Enroll free' : 'Enroll') : 'Log in to enroll'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}
