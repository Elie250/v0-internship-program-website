'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { isDeliveryPortalRole, deliveryLoginRoleForUser, isMentorDeliveryRole } from '@/lib/lecturer/delivery-portal'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Mail, BookOpen, Globe, Camera, FileText, ExternalLink } from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'

type TeamProfile = {
  profile_title: string
  profile_bio: string
  profile_photo_url: string
  show_on_team: boolean
  profile_education: string
  profile_experience: string
  profile_qualifications: string
  profile_cv_url: string
}

export default function LecturerProfilePage() {
  const router = useRouter()
  const photoRef = useRef<HTMLInputElement>(null)
  const cvRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [userRole, setUserRole] = useState('lecturer')
  const [userName, setUserName] = useState('')
  const [profile, setProfile] = useState<{
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    role: string
  } | null>(null)
  const [teamProfile, setTeamProfile] = useState<TeamProfile>({
    profile_title: '',
    profile_bio: '',
    profile_photo_url: '',
    show_on_team: false,
    profile_education: '',
    profile_experience: '',
    profile_qualifications: '',
    profile_cv_url: '',
  })
  const [programmes, setProgrammes] = useState<
    Array<{ id: string; title: string; status: string; program_type?: ProgramType }>
  >([])

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user || !isDeliveryPortalRole(user.role) || user.role === 'mentor') {
        router.push(
          user?.role === 'mentor'
            ? '/lecturer/dashboard'
            : `/auth/login?role=${deliveryLoginRoleForUser(user?.role ?? 'lecturer')}&redirect=/lecturer/profile`
        )
        return
      }
      setUserRole(user.role)
      setProfile({
        firstName: String(user.firstName ?? ''),
        lastName: String(user.lastName ?? ''),
        email: user.email,
        role: user.role,
      })
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.email ||
          (isMentorDeliveryRole(user.role) ? 'Mentor' : 'Lecturer')
      )

      const [profileRes, coursesRes] = await Promise.all([
        fetch('/api/lecturer/profile', { credentials: 'same-origin' }),
        fetch('/api/lecturer/courses', { credentials: 'same-origin' }),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                firstName: String(data.first_name ?? prev.firstName),
                lastName: String(data.last_name ?? prev.lastName),
              }
            : prev
        )
        setUserName(
          [data.first_name, data.last_name].filter(Boolean).join(' ') ||
            user.email ||
            'Lecturer'
        )
        setTeamProfile({
          profile_title: data.profile_title ?? '',
          profile_bio: data.profile_bio ?? '',
          profile_photo_url: data.profile_photo_url ?? '',
          show_on_team: Boolean(data.show_on_team),
          profile_education: data.profile_education ?? '',
          profile_experience: data.profile_experience ?? '',
          profile_qualifications: data.profile_qualifications ?? '',
          profile_cv_url: data.profile_cv_url ?? '',
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

  const saveAccountDetails = async () => {
    if (!profile) return
    setSaving(true)
    setSaveError('')
    setSaveMessage('')
    try {
      const res = await fetch('/api/lecturer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setUserName(
        [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email
      )
      setSaveMessage('Name updated.')
      router.refresh()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveTeamProfile = async (overrides?: Partial<TeamProfile>) => {
    const payload = { ...teamProfile, ...overrides }
    setSaving(true)
    setSaveError('')
    setSaveMessage('')
    try {
      const res = await fetch('/api/lecturer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          profileTitle: payload.profile_title,
          profileBio: payload.profile_bio,
          profilePhotoUrl: payload.profile_photo_url,
          showOnTeam: payload.show_on_team,
          profileEducation: payload.profile_education,
          profileExperience: payload.profile_experience,
          profileQualifications: payload.profile_qualifications,
          profileCvUrl: payload.profile_cv_url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      if (overrides) setTeamProfile(payload)
      setSaveMessage(
        payload.show_on_team
          ? 'Profile saved — you appear on the About Us page with your photo and CV details.'
          : 'Profile saved.'
      )
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const uploadFile = async (file: File, kind: 'photo' | 'cv') => {
    setUploadError('')
    if (kind === 'photo') setUploadingPhoto(true)
    else setUploadingCv(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      const res = await fetch('/api/lecturer/profile/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.hint ? `${data.error} — ${data.hint}` : data.error)
      }
      if (kind === 'photo') {
        setTeamProfile((p) => ({ ...p, profile_photo_url: data.url }))
        await saveTeamProfile({ profile_photo_url: data.url })
      } else {
        setTeamProfile((p) => ({ ...p, profile_cv_url: data.url }))
        await saveTeamProfile({ profile_cv_url: data.url })
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      if (kind === 'photo') setUploadingPhoto(false)
      else setUploadingCv(false)
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
    <LecturerPortalShell userName={userName} userRole={userRole}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            {isMentorDeliveryRole(profile.role)
              ? `${COMPANY.platformName} mentor account — manage your public team profile.`
              : `${COMPANY.platformName} lecturer account — add your photo and CV details for the team page.`}
          </p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-[var(--brand-navy)]" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 course-form-high-contrast">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, firstName: e.target.value } : p))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, lastName: e.target.value } : p))
                  }
                />
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
            <Button
              type="button"
              onClick={() => void saveAccountDetails()}
              disabled={saving || !profile.firstName.trim()}
              className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            >
              {saving ? 'Saving…' : 'Save name'}
            </Button>
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
              <Camera className="h-5 w-5 text-[var(--brand-navy)]" />
              Profile photo
            </CardTitle>
            <p className="text-sm text-slate-600">
              Upload a clear portrait. It appears on the About Us team section when you opt in.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadError ? (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">
                {uploadError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-28 w-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                {teamProfile.profile_photo_url ? (
                  <Image
                    src={teamProfile.profile_photo_url}
                    alt="Your profile"
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="max-w-xs"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadFile(file, 'photo')
                  }}
                />
                <p className="text-xs text-slate-500">JPG, PNG, or WebP · max 8 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="h-5 w-5 text-[var(--brand-navy)]" />
              CV details
            </CardTitle>
            <p className="text-sm text-slate-600">
              Education, experience, and qualifications shown on the public team page. You can also
              upload a PDF CV.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-education">Education</Label>
              <Textarea
                id="profile-education"
                className="min-h-[90px]"
                placeholder="e.g. BSc Electrical Engineering — University of Rwanda"
                value={teamProfile.profile_education}
                onChange={(e) =>
                  setTeamProfile((p) => ({ ...p, profile_education: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-experience">Professional experience</Label>
              <Textarea
                id="profile-experience"
                className="min-h-[110px]"
                placeholder="Roles, years of experience, industry focus…"
                value={teamProfile.profile_experience}
                onChange={(e) =>
                  setTeamProfile((p) => ({ ...p, profile_experience: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-qualifications">Qualifications &amp; certifications</Label>
              <Textarea
                id="profile-qualifications"
                className="min-h-[90px]"
                placeholder="Licences, certifications, professional memberships…"
                value={teamProfile.profile_qualifications}
                onChange={(e) =>
                  setTeamProfile((p) => ({ ...p, profile_qualifications: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>CV document (PDF)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  ref={cvRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="max-w-xs"
                  disabled={uploadingCv}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadFile(file, 'cv')
                  }}
                />
                {teamProfile.profile_cv_url ? (
                  <a
                    href={teamProfile.profile_cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-navy)] underline font-medium"
                  >
                    View uploaded CV
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">PDF only · max 8 MB</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Globe className="h-5 w-5 text-[var(--brand-navy)]" />
              Public team profile
            </CardTitle>
            <p className="text-sm text-slate-600">
              Opt in to appear on the About Us page with your title, photo, bio, and CV details.
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
                value={teamProfile.profile_title}
                onChange={(e) =>
                  setTeamProfile((p) => ({ ...p, profile_title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">Short bio</Label>
              <Textarea
                id="profile-bio"
                className="min-h-[120px]"
                placeholder="Your experience, specialisms, and what students can expect from your teaching…"
                value={teamProfile.profile_bio}
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
              disabled={saving || uploadingPhoto || uploadingCv}
              className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            >
              {saving ? 'Saving…' : 'Save profile'}
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
