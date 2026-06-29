'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import { AuthDebugPanel } from '@/components/auth/auth-debug-panel'
import type { AuthDebugInfo } from '@/lib/auth-debug'
import { COMPANY } from '@/lib/company/constants'

type LoginRole = 'student' | 'lecturer' | 'engineer' | 'admin'

const STAFF_ROLES: { value: LoginRole; label: string; hint: string }[] = [
  { value: 'lecturer', label: 'Lecturer', hint: 'Course delivery & admin panel' },
  { value: 'engineer', label: 'Engineer', hint: 'Community & technical support' },
  { value: 'admin', label: 'Administrator', hint: 'Platform management' },
]

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
  const [role, setRole] = useState<LoginRole>('student')
  const [showStaffRoles, setShowStaffRoles] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [debug, setDebug] = useState<AuthDebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('logout') === '1') {
      setSuccess('You have been signed out.')
    }
    if (searchParams.get('message') === 'registered') {
      setSuccess('Account created. Sign in with your email and password.')
    }
    if (searchParams.get('message') === 'staff_pending') {
      const pendingRole = searchParams.get('role')
      if (pendingRole === 'lecturer' || pendingRole === 'engineer') {
        setRole(pendingRole)
        setShowStaffRoles(true)
      }
      setSuccess(
        'Registration received. An administrator must approve your account before you can sign in.'
      )
    }
    if (searchParams.get('redirect')?.includes('/enroll')) {
      setSuccess((prev) => prev || 'Sign in to continue enrollment.')
    }
  }, [searchParams])

  const redirectTo = searchParams.get('redirect')
  const registerHref = redirectTo
    ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/register'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDebug(null)
    setIsLoading(true)

    try {
      const result = await loginUser(email, password, role)

      if (result.success) {
        const dest =
          redirectTo && redirectTo.startsWith('/')
            ? redirectTo
            : (result.redirectTo ?? '/dashboard')
        router.push(dest)
        router.refresh()
      } else {
        setError(result.error || 'Invalid email or password')
        setDebug(result.debug ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-slate-900">{COMPANY.brandName}</p>
          <p className="text-sm text-slate-500 mt-1">{COMPANY.platformName}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 text-center">Sign in</h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-6">
            Use the email and password for your account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {success ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            ) : null}

            {error ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <AuthDebugPanel error={error} debug={debug} />
              </div>
            ) : null}

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

            <Button
              type="submit"
              className="w-full h-11 bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90 text-white mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>

            <Collapsible open={showStaffRoles} onOpenChange={setShowStaffRoles}>
              <CollapsibleTrigger
                type="button"
                className="flex w-full items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-800 py-2"
              >
                {role === 'student' ? 'Staff or admin sign-in' : `Signing in as ${role}`}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showStaffRoles ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                <p className="text-xs text-slate-500 text-center pb-1">
                  Most users stay on <strong>Student</strong>. Expand only if you have a staff account.
                </p>
                {STAFF_ROLES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition ${
                      role === item.value
                        ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{item.hint}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm ${
                    role === 'student'
                      ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-medium text-slate-900">Student</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Courses & learning portal</span>
                </button>
              </CollapsibleContent>
            </Collapsible>
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
  )
}
