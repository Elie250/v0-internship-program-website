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
      subtitle="Confirm your email to create your account. A company workspace is opened by Energy & Logics or an existing company admin — not automatically."
    >
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        <EmailMagicForm
          mode="register"
          registerIntent="employer"
          redirect="/employer"
          companyName={companyName}
          submitLabel="Email me a confirmation link"
          extraFields={
            <div className="space-y-2">
              <Label htmlFor="company">Company or organization (optional)</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. EasyFab"
                className="h-11 rounded-xl"
              />
            </div>
          }
        />
        <p className="text-xs text-slate-500 leading-relaxed">
          You will use the same email if you also apply for jobs. Employer access is added to this
          account — we do not create a second login.
        </p>
        <AuthCardFooter showSignIn />
      </div>
    </TalentShell>
  )
}
