'use client'

import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { JobEditor } from '@/components/recruitment/job-editor'

export default function NewJobPage() {
  const { orgId, canWriteJobs } = useEmployerOrg()
  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Create job</h1>
      {!canWriteJobs ? (
        <p className="text-sm text-slate-600">Your role can view jobs but cannot create them.</p>
      ) : orgId ? (
        <JobEditor organizationId={orgId} />
      ) : null}
    </EmployerShell>
  )
}
