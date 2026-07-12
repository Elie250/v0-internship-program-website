import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { AlumniProfile } from '@/lib/alumni/profiles'

export function AlumniDirectory({ profiles }: { profiles: AlumniProfile[] }) {
  if (!profiles.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-slate-600">
          Graduates can share their profile from the student portal. Public alumni stories will appear here.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <Card key={profile.id} className="h-full">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-semibold text-slate-900">
              {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Alumni'}
            </h3>
            {profile.headline ? <p className="text-sm font-medium text-[var(--brand-navy)]">{profile.headline}</p> : null}
            {profile.programmeTitle ? (
              <p className="text-sm text-slate-600">{profile.programmeTitle}</p>
            ) : null}
            {profile.graduationYear ? (
              <p className="text-xs text-slate-500">Class of {profile.graduationYear}</p>
            ) : null}
            {profile.bio ? <p className="text-sm text-slate-700 line-clamp-4">{profile.bio}</p> : null}
            {profile.linkedinUrl ? (
              <Link href={profile.linkedinUrl} className="text-sm text-[var(--brand-navy)] underline" target="_blank">
                LinkedIn profile
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
