'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Cpu, GraduationCap } from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'
import { SiteHeader } from '@/components/layout/site-header'
import { cn } from '@/lib/utils'

type LoginRole = 'student' | 'lecturer' | 'engineer' | 'admin' | 'mentor'
type PublicRole = 'student' | 'engineer'
type StaffRole = 'lecturer' | 'mentor' | 'admin'
type AccountKind = 'public' | 'staff'

const PUBLIC_ROLES: {
  value: PublicRole
  label: string
  icon: typeof GraduationCap
}[] = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'engineer', label: 'Engineer', icon: Cpu },
]

const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'admin', label: 'Administrator' },
]

function isStaffRole(value: string): value is StaffRole {
  return value === 'lecturer' || value === 'mentor' || value === 'admin'
}

function isPublicRole(value: string): value is PublicRole {
  return value === 'student' || value === 'engineer'
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accountKind, setAccountKind] = useState<AccountKind>('public')
  const [publicRole, setPublicRole] = useState<PublicRole>('student')
  const [staffRole, setStaffRole] = useState<StaffRole>('lecturer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [requiresTotp, setRequiresTotp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const role: LoginRole = accountKind === 'public' ? publicRole : staffRole

  const applyRoleFromParam = (roleParam: string) => {
    if (isPublicRole(roleParam)) {
      setAccountKind('public')
      setPublicRole(roleParam)
      return
    }
    if (isStaffRole(roleParam)) {
      setAccountKind('staff')
      setStaffRole(roleParam)
    }
  }

  useEffect(() => {
    if (searchParams.get('logout') === '1') {
      setSuccess('You have been signed out.')
    }
    if (searchParams.get('message') === 'registered') {
      setSuccess('Account created. Sign in with your email and password.')
    }
    if (searchParams.get('message') === 'password_reset') {
      setSuccess('Password updated. Sign in with your new password.')
    }
    if (searchParams.get('message') === 'staff_pending') {
      const pendingRole = searchParams.get('role')
      if (pendingRole) applyRoleFromParam(pendingRole)
      setSuccess(
        'Registration received. An administrator must approve your account before you can sign in.'
      )
    }
    if (searchParams.get('redirect')?.includes('/enroll')) {
      setSuccess((prev) => prev || 'Sign in to continue enrollment.')
    }
    const roleParam = searchParams.get('role')
    if (roleParam) applyRoleFromParam(roleParam)
  }, [searchParams])

  const redirectTo = searchParams.get('redirect')
  const registerHref = redirectTo
    ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/register'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await loginUser(email, password, role, totpCode || undefined)

      if (result.success) {
        const dest =
          redirectTo && redirectTo.startsWith('/')
            ? redirectTo
            : (result.redirectTo ?? '/dashboard')
        router.push(dest)
        router.refresh()
      } else if (result.requiresTotp) {
        setRequiresTotp(true)
        setError(result.error || 'Enter your authenticator code')
      } else {
        setError(result.error || 'Invalid email or password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500">{COMPANY.platformName}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8">
            <h1 className="text-xl font-semibold text-slate-900 text-center mb-6">Sign in</h1>

            <form onSubmit={handleLogin} className="space-y-4">
              {success ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              ) : null}

              {error ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div>
                <Label className="text-slate-800 font-semibold">Sign in as</Label>
                <div
                  className="mt-1.5 flex rounded-lg border border-slate-300 bg-slate-200 p-1 shadow-inner"
                  role="radiogroup"
                  aria-label="Public account type"
                >
                  {PUBLIC_ROLES.map((item) => {
                    const selected = accountKind === 'public' && publicRole === item.value
                    const Icon = item.icon
                    return (
                      <button
                        key={item.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setAccountKind('public')
                          setPublicRole(item.value)
                        }}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-all',
                          selected
                            ? 'bg-[var(--brand-navy)] text-white shadow-md ring-2 ring-[var(--brand-navy)]/40'
                            : 'text-slate-800 hover:bg-white hover:text-slate-950'
                        )}
                      >
                        <Icon
                          className={cn('h-4 w-4 shrink-0', selected ? 'text-white' : 'text-slate-700')}
                          aria-hidden
                        />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-slate-800 font-semibold">Staff</Label>
                <Select
                  value={accountKind === 'staff' ? staffRole : undefined}
                  onValueChange={(value) => {
                    setAccountKind('staff')
                    setStaffRole(value as StaffRole)
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      'mt-1.5 w-full border-slate-400 text-slate-900',
                      accountKind === 'staff' &&
                        'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5 ring-2 ring-[var(--brand-navy)]/25 font-semibold'
                    )}
                  >
                    <SelectValue placeholder="Select staff role" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {STAFF_ROLES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-[var(--brand-navy)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              {requiresTotp ? (
                <div>
                  <Label htmlFor="totp" className="text-slate-700">
                    Authenticator code
                  </Label>
                  <Input
                    id="totp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    required
                    maxLength={6}
                    className="mt-1.5"
                  />
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full h-11 bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90 text-white mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-6">
              No account?{' '}
              <Link href={registerHref} className="font-medium text-[var(--brand-navy)] hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} {COMPANY.brandName}
          </p>
        </div>
      </div>
    </div>
  )
}
