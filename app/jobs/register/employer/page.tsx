'use client'

import { useState } from 'react'
import { TalentShell } from '@/components/recruitment/talent-ui'
import { AuthCardFooter, EmailMagicForm } from '@/components/recruitment/email-magic-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EmployerRegisterPage() {
  const [companyName, setCompanyName] = useState('')

  return (
    <TalentShell
      title="Create employer account"
      subtitle="Confirm your email to create your hiring login. A company workspace stays pending until Energy & Logics approves a new organization, or a company admin invites you."
    >
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        <EmailMagicForm
          mode="register"
          registerIntent="employer"
          redirect="/employer/pending"
          companyName={companyName}
          submitLabel="Email me a confirmation link"
          extraFields={
            <div className="space-y-2">
              <Label htmlFor="company">Company or organization name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. EasyFab Ltd"
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your company name to request a new hiring partner workspace. Leave blank only if you
                expect an invitation from an existing company admin.
              </p>
            </div>
          }
        />
        <p className="text-xs text-slate-500 leading-relaxed">
          You will use the same email if you also apply for jobs. Employer access is added to this
          account — we do not create a second login. Registering does not open an active company
          workspace by itself.
        </p>
        <AuthCardFooter showSignIn signInHref="/jobs/auth/continue?redirect=/employer/pending" />
      </div>
    </TalentShell>
  )
}
