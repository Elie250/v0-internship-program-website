'use client'



import { useEffect, useState } from 'react'

import Link from 'next/link'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { TalentShell } from '@/components/recruitment/talent-ui'

import {
  formatApplicationStatus,
  type RecruitmentApplicationStatus,
} from '@/lib/recruitment/types'



type Application = {

  id: string

  status: string

  submitted_at: string

  job?: {

    title?: string

    slug?: string

    organization?: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null

  } | null

}



type MeResponse = {

  user: { email: string; firstName?: string; lastName?: string }

  profileCompletion: { percent: number; missing: string[] }

  cvStatus: { hasCv: boolean; filename?: string; uploadedAt?: string }

  applications: Application[]

}



function orgName(app: Application): string {

  const org = app.job?.organization

  if (!org) return 'Employer'

  if (Array.isArray(org)) return org[0]?.name ?? 'Employer'

  return org.name ?? 'Employer'

}



function jobPath(app: Application): string | null {

  const org = app.job?.organization

  const slug = Array.isArray(org) ? org[0]?.slug : org?.slug

  const jobSlug = app.job?.slug

  if (!slug || !jobSlug) return null

  return `/o/${slug}/jobs/${jobSlug}`

}



export default function CandidateDashboardPage() {

  const router = useRouter()

  const [loading, setLoading] = useState(true)

  const [busyId, setBusyId] = useState('')

  const [error, setError] = useState('')

  const [me, setMe] = useState<MeResponse | null>(null)



  const load = async () => {

    const res = await fetch('/api/recruitment/me', { credentials: 'same-origin' })

    if (res.status === 401) {

      router.replace('/jobs/auth/continue?redirect=/app')

      return

    }

    const data = await res.json()

    if (!res.ok) {

      setError(data.error || 'Failed to load dashboard')

      setLoading(false)

      return

    }

    setMe(data)

    setLoading(false)

  }



  useEffect(() => {

    void load()

  }, [router])



  const withdraw = async (applicationId: string) => {

    setBusyId(applicationId)

    setError('')

    try {

      const res = await fetch('/api/recruitment/candidate/applications', {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        credentials: 'same-origin',

        body: JSON.stringify({ applicationId, action: 'withdraw' }),

      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Withdraw failed')

      await load()

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Withdraw failed')

    } finally {

      setBusyId('')

    }

  }



  if (loading) {

    return (

      <TalentShell title="My applications">

        <p className="text-slate-600">Loading dashboard…</p>

      </TalentShell>

    )

  }



  return (

    <TalentShell

      title="Candidate dashboard"

      subtitle={me?.user.email ? `Signed in as ${me.user.email}` : undefined}

    >

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">

        <div className="space-y-4">

          <Card className="border-slate-200">

            <CardHeader>

              <CardTitle className="text-base">Profile completion</CardTitle>

            </CardHeader>

            <CardContent className="space-y-3">

              <p className="text-3xl font-bold text-[var(--brand-navy)]">{me?.profileCompletion.percent ?? 0}%</p>

              {me?.profileCompletion.missing.length ? (

                <p className="text-sm text-slate-600">

                  Still helpful: {me.profileCompletion.missing.join(', ')}

                </p>

              ) : (

                <p className="text-sm text-emerald-700">Your profile looks strong.</p>

              )}

              <Link href="/app/profile">

                <Button variant="outline" size="sm">

                  Edit profile

                </Button>

              </Link>

            </CardContent>

          </Card>



          <Card className="border-slate-200">

            <CardHeader>

              <CardTitle className="text-base">CV status</CardTitle>

            </CardHeader>

            <CardContent className="space-y-2 text-sm text-slate-700">

              {me?.cvStatus.hasCv ? (

                <>

                  <p>

                    <strong>{me.cvStatus.filename}</strong>

                  </p>

                  {me.cvStatus.uploadedAt ? (

                    <p className="text-slate-600">

                      Uploaded {new Date(me.cvStatus.uploadedAt).toLocaleDateString()}

                    </p>

                  ) : null}

                </>

              ) : (

                <p>No CV uploaded yet.</p>

              )}

              <Link href="/app/profile#cv">

                <Button variant="outline" size="sm">

                  Manage CV

                </Button>

              </Link>

            </CardContent>

          </Card>

        </div>



        <Card className="border-slate-200">

          <CardHeader className="flex flex-row items-center justify-between">

            <CardTitle className="text-base">Applications</CardTitle>

            <Link href="/jobs">

              <Button size="sm" className="bg-[var(--brand-navy)] text-white">

                Find jobs

              </Button>

            </Link>

          </CardHeader>

          <CardContent className="space-y-4">

            {error ? (

              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>

            ) : null}



            {!me?.applications?.length ? (

              <p className="text-sm text-slate-600">You have not applied to any roles yet.</p>

            ) : (

              me.applications.map((app) => {

                const href = jobPath(app)

                const canWithdraw = app.status === 'submitted' || app.status === 'under_review'

                return (

                  <div key={app.id} className="rounded-lg border border-slate-200 p-4 space-y-2">

                    <div className="flex flex-wrap items-start justify-between gap-2">

                      <div>

                        <p className="font-semibold text-slate-900">{app.job?.title ?? 'Role'}</p>

                        <p className="text-sm text-slate-600">{orgName(app)}</p>

                        <p className="text-xs text-slate-500 mt-1">

                          Applied {new Date(app.submitted_at).toLocaleDateString()}

                        </p>

                      </div>

                      <Badge variant="outline">
                        {formatApplicationStatus(app.status as RecruitmentApplicationStatus)}
                      </Badge>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      {href ? (

                        <Link href={href} className="text-sm text-[var(--brand-navy)] underline">

                          View job

                        </Link>

                      ) : null}

                      {canWithdraw ? (

                        <Button

                          size="sm"

                          variant="outline"

                          disabled={busyId === app.id}

                          onClick={() => void withdraw(app.id)}

                        >

                          Withdraw

                        </Button>

                      ) : null}

                    </div>

                  </div>

                )

              })

            )}

          </CardContent>

        </Card>

      </div>

    </TalentShell>

  )

}


