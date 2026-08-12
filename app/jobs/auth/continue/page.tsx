'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BrandMark, TalentShell } from '@/components/recruitment/talent-ui'
import { AuthCardFooter, EmailMagicForm } from '@/components/recruitment/email-magic-form'

function ContinueInner() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const registerHref = (() => {
    if (!redirect) return '/jobs/register'
    if (redirect.startsWith('/employer')) return '/jobs/register/employer'
    if (redirect.startsWith('/app') || redirect.startsWith('/o/')) {
      return `/jobs/register/candidate?redirect=${encodeURIComponent(redirect)}`
    }
    return '/jobs/register'
  })()

  return (
    <TalentShell title="Sign in" subtitle="Continue with Email. No password to create or reset.">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
          <div className="sm:hidden">
            <BrandMark compact />
          </div>
          <EmailMagicForm
            mode="signin"
            redirect={redirect}
            submitLabel="Continue with Email"
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            After you confirm the link, we open the right workspace for your account — candidate,
            hiring, or a choice if you use both.
          </p>
          <AuthCardFooter showRegister registerHref={registerHref} />
          <p className="text-sm">
            <Link href="/jobs" className="font-medium text-[var(--brand-navy)] hover:underline">
              ← Back to job board
            </Link>
          </p>
        </div>
      </div>
    </TalentShell>
  )
}

export default function JobsSignInPage() {
  return (
    <Suspense
      fallback={
        <TalentShell title="Sign in">
          <p className="text-slate-600">Loading…</p>
        </TalentShell>
      }
    >
      <ContinueInner />
    </Suspense>
  )
}
