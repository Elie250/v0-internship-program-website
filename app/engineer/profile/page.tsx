'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Camera, ExternalLink, FileText, Mail, User } from 'lucide-react'

type EngineerProfile = {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  profile_title: string | null
  profile_bio: string | null
  profile_photo_url: string | null
  profile_education: string | null
  profile_experience: string | null
  profile_qualifications: string | null
  profile_cv_url: string | null
}

export default function EngineerProfilePage() {
  const photoRef = useRef<HTMLInputElement>(null)
  const cvRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [profile, setProfile] = useState<EngineerProfile>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profile_title: '',
    profile_bio: '',
    profile_photo_url: '',
    profile_education: '',
    profile_experience: '',
    profile_qualifications: '',
    profile_cv_url: '',
  })

  useEffect(() => {
    void fetch('/api/engineer/profile', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          profile_title: data.profile_title ?? '',
          profile_bio: data.profile_bio ?? '',
          profile_photo_url: data.profile_photo_url ?? '',
          profile_education: data.profile_education ?? '',
          profile_experience: data.profile_experience ?? '',
          profile_qualifications: data.profile_qualifications ?? '',
          profile_cv_url: data.profile_cv_url ?? '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const uploadFile = async (file: File, kind: 'photo' | 'cv') => {
    setUploadError('')
    if (kind === 'photo') setUploadingPhoto(true)
    else setUploadingCv(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      const res = await fetch('/api/engineer/profile/upload', {
        method: 'POST',
        body,
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      if (kind === 'photo') {
        setProfile((p) => ({ ...p, profile_photo_url: data.url }))
      } else {
        setProfile((p) => ({ ...p, profile_cv_url: data.url }))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      if (kind === 'photo') setUploadingPhoto(false)
      else setUploadingCv(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaveError('')
    setSaveMessage('')
    try {
      const res = await fetch('/api/engineer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setProfile({
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        profile_title: data.profile_title ?? '',
        profile_bio: data.profile_bio ?? '',
        profile_photo_url: data.profile_photo_url ?? '',
        profile_education: data.profile_education ?? '',
        profile_experience: data.profile_experience ?? '',
        profile_qualifications: data.profile_qualifications ?? '',
        profile_cv_url: data.profile_cv_url ?? '',
      })
      setSaveMessage('Profile saved.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <EngineerPageFrame title="Profile" description="Your engineer account">
        <p className="text-slate-600">Loading profile…</p>
      </EngineerPageFrame>
    )
  }

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email

  return (
    <EngineerPageFrame title="Profile" description="Your engineer account">
      <div className="space-y-6 max-w-3xl">
        {saveMessage ? (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
            {saveMessage}
          </p>
        ) : null}
        {saveError ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">
            {saveError}
          </p>
        ) : null}
        {uploadError ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">
            {uploadError}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5" />
              Public author profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-slate-600">
              This information appears on your{' '}
              <Link href="/engineering/authors" className="text-[var(--brand-navy)] underline">
                Field Notes author page
              </Link>{' '}
              when you publish articles.
            </p>

            <div className="flex flex-wrap items-start gap-5">
              <div className="relative h-28 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                {profile.profile_photo_url ? (
                  <Image
                    src={profile.profile_photo_url}
                    alt={displayName}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl font-semibold text-[var(--brand-navy)]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadFile(file, 'photo')
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingPhoto}
                  onClick={() => photoRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {uploadingPhoto ? 'Uploading…' : 'Change photo'}
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input
                  value={profile.first_name ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input
                  value={profile.last_name ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={profile.email} disabled className="bg-slate-50" />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={profile.phone ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+250 …"
              />
            </div>

            <div className="space-y-2">
              <Label>Professional title</Label>
              <Input
                value={profile.profile_title ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, profile_title: e.target.value }))}
                placeholder="e.g. PLC & electrical engineer"
              />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                className="min-h-[100px]"
                value={profile.profile_bio ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, profile_bio: e.target.value }))}
                placeholder="Short intro for your author page"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">CV details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Education</Label>
              <Textarea
                value={profile.profile_education ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, profile_education: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Experience</Label>
              <Textarea
                value={profile.profile_experience ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, profile_experience: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Qualifications</Label>
              <Textarea
                value={profile.profile_qualifications ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, profile_qualifications: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>CV PDF</Label>
              {profile.profile_cv_url ? (
                <a
                  href={profile.profile_cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--brand-navy)] underline inline-flex items-center gap-1"
                >
                  View current CV <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="text-sm text-slate-500">No CV uploaded yet.</p>
              )}
              <input
                ref={cvRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadFile(file, 'cv')
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingCv}
                onClick={() => cvRef.current?.click()}
              >
                <FileText className="h-4 w-4 mr-2" />
                {uploadingCv ? 'Uploading…' : 'Upload CV PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => void save()}
          disabled={saving}
          className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </EngineerPageFrame>
  )
}
