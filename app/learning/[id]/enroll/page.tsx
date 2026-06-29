import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Button } from '@/components/ui/button'
import { CourseEnrollForm } from '@/components/learning/course-enroll-form'
import { getCourseById } from '@/lib/platform/queries'
import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { CheckCircle2 } from 'lucide-react'

export default async function CourseEnrollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) redirect('/learning')

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/learning/${id}/enroll`)}`)
  }

  if (user.role !== 'student' && user.role !== 'registered') {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />
        <section className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Student account required</h1>
          <p className="text-muted-foreground">
            Course enrollment is available for student accounts. You are logged in as{' '}
            <strong>{user.role}</strong>.
          </p>
          <Link href="/learning">
            <Button variant="outline">Back to courses</Button>
          </Link>
        </section>
        <SiteFooter />
      </main>
    )
  }

  let phone: string | null = null
  if (supabaseAdmin && user.id) {
    const { data } = await supabaseAdmin.from('users').select('phone').eq('id', user.id).maybeSingle()
    phone = data?.phone ?? null
  }

  const price = Number(course.pricing ?? 0)

  return (
    <main className="min-h-screen bg-slate-50/80">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-sm mb-2">Secure enrollment</p>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-white/85 mt-2">
            {price > 0 ? `${price.toLocaleString()} RWF` : 'Pricing on request'} · Logged in as{' '}
            {user.email}
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/learning/${course.id}`}>
            <Button variant="ghost" size="sm">← Back to course</Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <CheckCircle2 className="h-4 w-4" />
            Account verified
          </div>
        </div>

        <CourseEnrollForm
          course={course}
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone,
          }}
        />
      </section>
      <SiteFooter />
    </main>
  )
}
