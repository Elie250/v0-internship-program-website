'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Mail, BookOpen, Globe } from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'

type TeamProfile = {
  profile_title: string | null
  profile_bio: string | null
  profile_photo_url: string | null
  show_on_team: boolean
}

export default function LecturerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [userName, setUserName] = useState('')
  const [profile, setProfile] = useState<{
    firstName?: string
    lastName?: string
    email: string
    phone?: string | null
    role: string
  } | null>(null)
  const [teamProfile, setTeamProfile] = useState<TeamProfile>({
    profile_title: '',
    profile_bio: '',
    profile_photo_url: '',
    show_on_team: false,
  })
  const [programmes, setProgrammes] = useState<
    Array<{ id: string; title: string; status: string; program_type?: ProgramType }>
  >([])

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user || (user.role !== 'lecturer' && user.role !== 'instructor' && user.role !== 'support_staff')) {
        router.push('/auth/login?role=lecturer&redirect=/lecturer/profile')
        return
      }
      setProfile(user)
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Lecturer'
      )

      const [profileRes, coursesRes] = await Promise.all([
        fetch('/api/lecturer/profile', { credentials: 'same-origin' }),
        fetch('/api/lecturer/courses', { credentials: 'same-origin' }),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setTeamProfile({
          profile_title: data.profile_title ?? '',
          profile_bio: data.profile_bio ?? '',
          profile_photo_url: data.profile_photo_url ?? '',
          show_on_team: Boolean(data.show_on_team),
        })
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setProgrammes(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    }
    void init()
  }, [router])

  const saveTeamProfile = async () => {
    setSaving(true)
    setSaveError('')
    setSaveMessage('')
    try {
      const res = await fetch('/api/lecturer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          profileTitle: teamProfile.profile_title,
          profileBio: teamProfile.profile_bio,
          profilePhotoUrl: teamProfile.profile_photo_url,
          showOnTeam: teamProfile.show_on_team,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSaveMessage(
        teamProfile.show_on_team
          ? 'Public team profile saved — you appear on the About Us page.'
          : 'Profile saved.'
      )
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading profile…</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <LecturerPortalShell userName={userName}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-600 mt-1">{COMPANY.platformName} lecturer account</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-[var(--brand-navy)]" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>
                <p className="font-semibold text-slate-900 mt-1">
                  {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
                <p className="font-semibold text-slate-900 mt-1 capitalize">{profile.role}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                  {profile.email}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              <Link href="/auth/forgot-password" className="text-[var(--brand-navy)] underline font-medium">
                Reset your password
              </Link>
              {' '}or contact{' '}
              <a href={`mailto:${COMPANY.email}`} className="text-[var(--brand-navy)] underline">
                {COMPANY.email}
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Globe className="h-5 w-5 text-[var(--brand-navy)]" />
              Public team profile
            </CardTitle>
            <p className="text-sm text-slate-600">
              Opt in to appear on the About Us page with your title, photo, and bio.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveError ? (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">
                {saveError}
              </p>
            ) : null}
            {saveMessage ? (
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">
                {saveMessage}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="profile-title">Professional title</Label>
              <Input
                id="profile-title"
                placeholder="e.g. Electrical Systems Instructor"
                value={teamProfile.profile_title ?? ''}
                onChange={(e) =>
                  setTeamProfile((p) => ({ ...p, profile_title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-photo">Photo URL</Label>
              <Input
                id="profile-photo"
                placeholder="https://… (portrait photo)"
                value={teamProfile.profile_photo_url ?? ''}
                onChange={(e) =>
                  setTeamProfile((p) => ({ ...p, profile_photo_url: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                className="min-h-[120px]"
                placeholder="Your experience, specialisms, and what students can expect from your teaching…"
                value={teamProfile.profile_bio ?? ''}
                onChange={(e) => setTeamProfile((p) => ({ ...p, profile_bio: e.target.value }))}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="show-on-team"
                checked={teamProfile.show_on_team}
                onCheckedChange={(checked) =>
                  setTeamProfile((p) => ({ ...p, show_on_team: checked === true }))
                }
              />
              <Label htmlFor="show-on-team" className="font-normal cursor-pointer leading-snug">
                Show my profile on the public About Us page (requires title and bio)
              </Label>
            </div>

            <Button
              onClick={() => void saveTeamProfile()}
              disabled={saving}
              className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            >
              {saving ? 'Saving…' : 'Save public profile'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BookOpen className="h-5 w-5 text-[var(--brand-navy)]" />
              Assigned programmes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programmes.length === 0 ? (
              <p className="text-sm text-slate-600">
                No programmes assigned yet — ask admin to assign you under Programs.
              </p>
            ) : (
              <ul className="space-y-2">
                {programmes.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {PROGRAM_TYPE_LABELS[p.program_type ?? 'training']}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          p.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-900'
                        }
                      >
                        {p.status}
                      </Badge>
                      <Link href={`/lecturer/courses/${p.id}`}>
                        <Button size="sm" variant="outline" className="text-slate-900 border-slate-300">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </LecturerPortalShell>
  )
}
