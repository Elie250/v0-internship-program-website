import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, GraduationCap, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PublicTeamMember } from '@/lib/platform/team'

function roleLabel(role: string) {
  if (role === 'support_staff') return 'Support staff'
  if (role === 'instructor') return 'Instructor'
  return 'Lecturer'
}

export function OurTeamSection({ members }: { members: PublicTeamMember[] }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Users className="h-5 w-5 text-[var(--brand-navy)]" />
          Our teaching team
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Lecturers and instructors who chose to share their profile on our public About page. Each
          member completes a bio and opts in from their lecturer portal before appearing here.
        </p>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-2">
            <GraduationCap className="h-8 w-8 text-[var(--brand-navy)] mx-auto opacity-80" />
            <p className="text-sm text-slate-700 font-medium">Team profiles coming soon</p>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              When lecturers publish their title, bio, and enable &ldquo;Show on About Us&rdquo; in
              their profile settings, they will appear in this section automatically.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-[var(--brand-navy)]/20 transition-colors"
              >
                <div className="flex gap-4 items-start">
                  <div className="relative w-24 h-28 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                    {member.photoUrl ? (
                      <Image
                        src={member.photoUrl}
                        alt={member.name}
                        fill
                        className="object-cover object-top"
                        sizes="96px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[var(--brand-navy)] bg-white">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-lg text-[var(--brand-navy)]">{member.name}</p>
                    {member.title ? (
                      <p className="text-sm text-slate-600 mt-0.5">{member.title}</p>
                    ) : null}
                    <Badge variant="outline" className="mt-2 text-xs border-slate-300 text-slate-700">
                      {roleLabel(member.role)}
                    </Badge>
                  </div>
                </div>

                {member.bio ? (
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {member.bio}
                  </p>
                ) : null}

                {member.education || member.experience || member.qualifications || member.cvUrl ? (
                  <div className="space-y-3 border-t border-slate-200 pt-3">
                    {member.education ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Education
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
                          {member.education}
                        </p>
                      </div>
                    ) : null}
                    {member.experience ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Experience
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
                          {member.experience}
                        </p>
                      </div>
                    ) : null}
                    {member.qualifications ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Qualifications
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
                          {member.qualifications}
                        </p>
                      </div>
                    ) : null}
                    {member.cvUrl ? (
                      <a
                        href={member.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-navy)] underline"
                      >
                        View CV
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {member.programmes.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Programmes
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {member.programmes.map((title) => (
                        <li
                          key={title}
                          className="text-xs border border-slate-200 rounded-md px-2.5 py-1 bg-white text-slate-800"
                        >
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Link
                  href={`/engineering/authors/${member.id}`}
                  className="inline-block text-sm font-medium text-[var(--brand-navy)] underline"
                >
                  View public profile
                </Link>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
