'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export async function signOutTalentAccount(redirectTo = '/jobs') {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => null)
  window.location.href = redirectTo
}

/**
 * Account-aware careers nav: Sign in / Create account when logged out,
 * My applications + Sign out when logged in.
 */
export function RecruitmentAccountNav() {
  const [email, setEmail] = useState<string | null>(null)
  const [canHire, setCanHire] = useState(false)
  const [ready, setReady] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
        if (!res.ok) {
          setEmail(null)
          setReady(true)
          return
        }
        const data = await res.json()
        setEmail(data.user?.email ?? null)
        setCanHire(Boolean(data.capabilities?.canUseEmployer))
      } catch {
        setEmail(null)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const onSignOut = async () => {
    setSigningOut(true)
    await signOutTalentAccount('/jobs')
  }

  if (!ready) {
    return (
      <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm" aria-label="Careers navigation">
        <Link
          href="/jobs"
          className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
        >
          Browse jobs
        </Link>
      </nav>
    )
  }

  if (!email) {
    return (
      <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm" aria-label="Careers navigation">
        <Link
          href="/jobs"
          className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
        >
          Browse jobs
        </Link>
        <Link
          href="/jobs/auth/continue"
          className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/jobs/register"
          className="rounded-md px-3 py-2 font-medium text-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/5 transition-colors"
        >
          Create an account
        </Link>
      </nav>
    )
  }

  return (
    <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm" aria-label="Account navigation">
      <Link
        href="/jobs"
        className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
      >
        Browse jobs
      </Link>
      <Link
        href="/app"
        className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
      >
        My applications
      </Link>
      <Link
        href="/app/profile"
        className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
      >
        Profile
      </Link>
      {canHire ? (
        <Link
          href="/employer"
          className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
        >
          Hiring
        </Link>
      ) : null}
      <span className="hidden md:inline px-2 text-xs text-slate-500 max-w-[10rem] truncate" title={email}>
        {email}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg h-8"
        disabled={signingOut}
        onClick={() => void onSignOut()}
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </nav>
  )
}

export function AccountSignOutButton({
  redirectTo = '/jobs',
  variant = 'outline',
  className,
  light = false,
}: {
  redirectTo?: string
  variant?: 'outline' | 'ghost' | 'default'
  className?: string
  light?: boolean
}) {
  const [signingOut, setSigningOut] = useState(false)
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={
        className ||
        (light
          ? 'rounded-lg h-8 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white'
          : 'rounded-lg h-8')
      }
      disabled={signingOut}
      onClick={() => {
        setSigningOut(true)
        void signOutTalentAccount(redirectTo)
      }}
    >
      {signingOut ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
