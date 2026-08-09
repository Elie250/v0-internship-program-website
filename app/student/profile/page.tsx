'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, BookOpen, Users, Camera, Lock } from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'

type AccountEditAccess = {
  periodOpen: boolean
  lockedByAdmin: boolean
  canEdit: boolean
  reason: string | null
}

type StudentProfile = {
  phone: string
  profile_photo_url: string
  parent_guardian_name: string
  parent_guardian_phone: string
  parent_guardian_email: string
  parent_guardian_relationship: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [userName, setUserName] = useState('')
  const [account, setAccount] = useState<{
    firstName?: string
    lastName?: string
    email: string
  } | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountEdit, setAccountEdit] = useState<AccountEditAccess>({
    periodOpen: false,
    lockedByAdmin: false,
    canEdit: false,
    reason: 'Checking edit access…',
  })
  const [profile, setProfile] = useState<StudentProfile>({
    phone: '',
    profile_photo_url: '',
    parent_guardian_name: '',
    parent_guardian_phone: '',
    parent_guardian_email: '',
    parent_guardian_relationship: '',
  })
  const [activePrograms, setActivePrograms] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      getStudentPortalData(),
      fetch('/api/student/profile', { credentials: 'same-origin' }),
    ]).then(([portal, profileRes]) => {
      if (!portal.success) {
        router.push('/auth/login?redirect=/student/profile')
        return
      }
      const { user, activeCourses, upcomingCourses } = portal.data
      setAccount({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
      )
      setActivePrograms([
        ...activeCourses.map((c) => c.title),
        ...upcomingCourses.map((c) => c.title),
      ])

      if (profileRes.ok) {
        void profileRes.json().then((data) => {
          setProfile({
            phone: data.phone ?? user.phone ?? '',
            profile_photo_url: data.profile_photo_url ?? '',
            parent_guardian_name: data.parent_guardian_name ?? '',
            parent_guardian_phone: data.parent_guardian_phone ?? '',
            parent_guardian_email: data.parent_guardian_email ?? '',
            parent_guardian_relationship: data.parent_guardian_relationship ?? '',
          })
          if (data.first_name) setFirstName(String(data.first_name))
          if (data.last_name) setLastName(String(data.last_name))
          if (data.accountEdit) {
            setAccountEdit(data.accountEdit as AccountEditAccess)
          }
          setUserName(
            [data.first_name ?? user.firstName, data.last_name ?? user.lastName]
              .filter(Boolean)
              .join(' ') || user.email
          )
        })
      } else {
        setProfile((p) => ({ ...p, phone: user.phone ?? '' }))
      }

      setLoading(false)
    })
  }, [router])

  const saveProfile = async (overrides?: Partial<StudentProfile>) => {
    const payload = { ...profile, ...overrides }
    if (accountEdit.canEdit && newPassword && newPassword !== confirmPassword) {
      setSaveError('New password and confirmation do not match.')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaveMessage('')
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          phone: payload.phone,
          profilePhotoUrl: payload.profile_photo_url,
          parentGuardianName: payload.parent_guardian_name,
          parentGuardianPhone: payload.parent_guardian_phone,
          parentGuardianEmail: payload.parent_guardian_email,
          parentGuardianRelationship: payload.parent_guardian_relationship,
          ...(accountEdit.canEdit
            ? {
                firstName,
                lastName,
                ...(newPassword
                  ? { currentPassword, newPassword }
                  : {}),
              }
            : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      if (overrides) setProfile(payload)
      if (data.first_name || data.last_name) {
        setAccount((prev) =>
          prev
            ? {
                ...prev,
                firstName: data.first_name ?? prev.firstName,
                lastName: data.last_name ?? prev.lastName,
              }
            : prev
        )
        setUserName(
          [data.first_name ?? firstName, data.last_name ?? lastName].filter(Boolean).join(' ') ||
            account?.email ||
            ''
        )
      }
      if (data.accountEdit) setAccountEdit(data.accountEdit as AccountEditAccess)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaveMessage(
        newPassword
          ? 'Name and password saved.'
          : 'Profile saved. Your photo will appear on certificates when you print them.'
      )
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    setUploadError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/student/profile/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.hint ? `${data.error} — ${data.hint}` : data.error)
      }
      setProfile((p) => ({ ...p, profile_photo_url: data.url }))
      await saveProfile({ profile_photo_url: data.url })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading profile…</p>
      </div>
    )
  }

  if (!account) return null

  return (
    <StudentPortalShell userName={userName}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            {COMPANY.platformName} student account — add a photo for your certificates and parent
            contact details.
          </p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-[var(--brand-navy)]" />
              Name &amp; password
            </CardTitle>
            <p className="text-sm text-slate-600">
              {accountEdit.canEdit
                ? 'Registration period is open. You can correct your name and change your password.'
                : accountEdit.reason ||
                  'Name and password edits are locked. Contact an administrator.'}
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  disabled={!accountEdit.canEdit}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  disabled={!accountEdit.canEdit}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                  {account.email}
                </p>
              </div>
            </div>

            {accountEdit.canEdit ? (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change password (optional)
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Forgot your password?{' '}
                <Link href="/auth/forgot-password" className="text-[var(--brand-navy)] underline font-medium">
                  Request a reset
                </Link>{' '}
                or contact{' '}
                <a href={`mailto:${COMPANY.email}`} className="text-[var(--brand-navy)] underline">
                  {COMPANY.email}
                </a>
                .
              </p>
            )}

            {accountEdit.canEdit ? (
              <Button
                onClick={() => void saveProfile()}
                disabled={saving || uploading}
                className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
              >
                {saving ? 'Saving…' : 'Save name & password'}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Camera className="h-5 w-5 text-[var(--brand-navy)]" />
              Profile photo
            </CardTitle>
            <p className="text-sm text-slate-600">
              Upload a clear portrait photo. It appears on your certificates when you download or
              print them.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadError ? (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">
                {uploadError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-24 w-24 rounded-full border-2 border-[var(--brand-navy)]/20 overflow-hidden bg-slate-100 shrink-0">
                {profile.profile_photo_url ? (
                  <Image
                    src={profile.profile_photo_url}
                    alt="Your profile"
                    fill
                    className="object-cover"
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
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="max-w-xs"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handlePhotoUpload(file)
                  }}
                />
                <p className="text-xs text-slate-500">JPG, PNG, or WebP · max 5 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5 text-[var(--brand-navy)]" />
              Contact &amp; parent / guardian
            </CardTitle>
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
              <Label htmlFor="phone">Your phone (MoMo)</Label>
              <Input
                id="phone"
                placeholder="e.g. 0781234567"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-4">
              <p className="text-sm font-medium text-slate-700">Parent or guardian</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="parent-name">Full name</Label>
                  <Input
                    id="parent-name"
                    placeholder="Parent or guardian name"
                    value={profile.parent_guardian_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, parent_guardian_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-relationship">Relationship</Label>
                  <Input
                    id="parent-relationship"
                    placeholder="e.g. Mother, Father, Guardian"
                    value={profile.parent_guardian_relationship}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, parent_guardian_relationship: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-phone">Phone</Label>
                  <Input
                    id="parent-phone"
                    placeholder="Contact number"
                    value={profile.parent_guardian_phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, parent_guardian_phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="parent-email">Email</Label>
                  <Input
                    id="parent-email"
                    type="email"
                    placeholder="parent@example.com"
                    value={profile.parent_guardian_email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, parent_guardian_email: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => void saveProfile()}
              disabled={saving || uploading}
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
              Your programmes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activePrograms.length === 0 ? (
              <p className="text-sm text-slate-600">No active enrollments yet.</p>
            ) : (
              <ul className="space-y-2">
                {activePrograms.map((title) => (
                  <li key={title}>
                    <Badge variant="outline" className="text-slate-800 border-slate-300">
                      {title}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/student/courses?track=training" className="inline-block mt-4">
              <Button size="sm" variant="outline" className="text-slate-900 border-slate-300">
                Browse programmes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </StudentPortalShell>
  )
}
