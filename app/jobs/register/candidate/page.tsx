'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TalentShell } from '@/components/recruitment/talent-ui'
import { AuthCardFooter, EmailMagicForm } from '@/components/recruitment/email-magic-form'

function CandidateRegisterInner() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/app'

  return (
    <TalentShell
      title="Create candidate account"
      subtitle="Confirm your email, then complete your profile and start applying."
    >
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        <EmailMagicForm
          mode="register"
          registerIntent="candidate"
          redirect={redirect}
          submitLabel="Email me a confirmation link"
        />
        <AuthCardFooter showSignIn />
      </div>
    </TalentShell>
  )
}

export default function CandidateRegisterPage() {
  return (
    <Suspense
      fallback={
        <TalentShell title="Create candidate account">
          <p className="text-slate-600">Loading…</p>
        </TalentShell>
      }
    >
      <CandidateRegisterInner />
    </Suspense>
  )
}
