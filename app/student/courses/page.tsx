'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getStudentPortalData, type StudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { StudentBrowseCourses } from '@/components/student/student-browse-courses'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CAREER_PROGRAM_TYPES,
  PROGRAM_TYPE_LABELS,
  STUDENT_TRACKS,
  type ProgramType,
  type StudentTrackId,
} from '@/lib/enrollment/program-types'

function parseTrack(value: string | null): StudentTrackId {
  if (value === 'internship' || value === 'career') return value
  return 'training'
}

export default function StudentCoursesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const track = parseTrack(searchParams.get('track'))
  const programType = (searchParams.get('type') as ProgramType | null) ?? null
  const [portal, setPortal] = useState<StudentPortalData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const catalogOptions = useMemo(() => {
    if (programType && CAREER_PROGRAM_TYPES.includes(programType)) {
      return { catalogProgramType: programType }
    }
    return { catalogTrack: track }
  }, [track, programType])

  useEffect(() => {
    setLoading(true)
    getStudentPortalData(catalogOptions).then((result) => {
      if (!result.success) {
        if (result.error.includes('log in')) {
          router.push(`/auth/login?redirect=/student/courses?track=${track}`)
          return
        }
        setError(result.error)
      } else {
        setPortal(result.data)
      }
      setLoading(false)
    })
  }, [router, track, programType, catalogOptions])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading programmes…</p>
      </div>
    )
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-red-700">{error || 'Unable to load courses'}</p>
            <Link href="/auth/login"><Button>Log in</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userName =
    [portal.user.firstName, portal.user.lastName].filter(Boolean).join(' ') || portal.user.email

  const trackMeta = STUDENT_TRACKS.find((t) => t.id === track) ?? STUDENT_TRACKS[0]

  return (
    <StudentPortalShell userName={userName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Choose a programme</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Pick training, internship, or career programmes. Paid programmes require MoMo verification;
            free programmes unlock instantly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STUDENT_TRACKS.map((item) => (
            <Link
              key={item.id}
              href={`/student/courses?track=${item.id}`}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium no-underline hover:no-underline transition',
                track === item.id && !programType
                  ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {track === 'career' ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/student/courses?track=career"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium no-underline hover:no-underline',
                !programType
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200'
              )}
            >
              All career
            </Link>
            {CAREER_PROGRAM_TYPES.map((type) => (
              <Link
                key={type}
                href={`/student/courses?track=career&type=${type}`}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium no-underline hover:no-underline',
                  programType === type
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200'
                )}
              >
                {PROGRAM_TYPE_LABELS[type]}
              </Link>
            ))}
          </div>
        ) : null}

        <StudentBrowseCourses
          courses={portal.catalogCourses}
          enrollEligibility={portal.enrollEligibility}
          heading={programType ? PROGRAM_TYPE_LABELS[programType] : trackMeta.label}
        />
      </div>
    </StudentPortalShell>
  )
}
