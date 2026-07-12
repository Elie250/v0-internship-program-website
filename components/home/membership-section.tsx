import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { loadHomePersonalization } from '@/lib/home/personalization'

const STUDENT_PORTAL_LOGIN = '/auth/login?redirect=%2Fstudent%2Fcourses'
const ENGINEER_SUPPORT = '/auth/login?redirect=%2Fengineering-support'

export async function MembershipSection() {
  const personalization = await loadHomePersonalization()

  if (personalization?.hasEnrollment) {
    return (
      <section id="membership" className="home-section home-section--compact home-section--muted">
        <div className="max-w-5xl mx-auto">
          <Card className="border-[var(--brand-navy)]/20 bg-white shadow-sm">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">You&apos;re enrolled</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {personalization.activeCourses.length} active{' '}
                  {personalization.activeCourses.length === 1 ? 'programme' : 'programmes'} on your account.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={personalization.portal.href}>
                  <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                    Open portal
                  </Button>
                </Link>
                <Link href="/student/courses?track=training">
                  <Button size="sm" variant="outline" className="text-slate-800 border-slate-300">
                    More courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="membership" className="home-section home-section--compact home-section--muted">
      <div className="max-w-5xl mx-auto">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Free & premium access</p>
              <p className="text-sm text-slate-600 mt-0.5">
                Create a free account for career resources, or sign in for full programmes, support, and AI tools.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href={STUDENT_PORTAL_LOGIN}>
                <Button size="sm" variant="outline" className="text-slate-800 border-slate-300">
                  Get started free
                </Button>
              </Link>
              <Link href={ENGINEER_SUPPORT}>
                <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                  Engineer support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-500 mt-3">
          Paid programmes use{' '}
          <Link href="/payment-instructions" className="text-[var(--brand-navy)] underline">
            MTN MoMo verification
          </Link>
          {' '}after enrollment.
        </p>
      </div>
    </section>
  )
}
