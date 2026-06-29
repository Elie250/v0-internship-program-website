'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { registerUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, ChevronDown, GraduationCap } from 'lucide-react'
import { AuthDebugPanel } from '@/components/auth/auth-debug-panel'
import type { AuthDebugInfo } from '@/lib/auth-debug'
import { COMPANY } from '@/lib/company/constants'
import { SiteHeader } from '@/components/layout/site-header'

type RegisterRole = 'student' | 'lecturer' | 'engineer'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const enrolling = Boolean(redirectTo?.includes('/enroll'))

  const [role, setRole] = useState<RegisterRole>('student')
  const [showOtherRoles, setShowOtherRoles] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [debug, setDebug] = useState<AuthDebugInfo | null>(null)
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const loginHref = redirectTo
    ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/login'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDebug(null)
    setSuccess('')

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError('Please fill in all required fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const result = await registerUser(email, password, firstName, lastName, role, phone || undefined)

      if (!result) {
        setError('No response from server. Try again in a moment.')
        return
      }

      if (result.success) {
        if (result.pendingApproval) {
          router.push(result.redirectTo ?? '/auth/login?message=staff_pending&role=lecturer')
          return
        }
        const dest =
          redirectTo && redirectTo.startsWith('/')
            ? redirectTo
            : (result.redirectTo ?? '/student/dashboard')
        router.push(dest)
        router.refresh()
        return
      }

      setError(result.error || 'Registration failed')
      setDebug(result.debug ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      {enrolling ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 flex gap-3 shadow-sm">
          <GraduationCap className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            Create a <strong className="text-slate-900">student</strong> account to enroll and upload your MoMo receipt.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-500 mt-1">Free — takes about a minute</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {success ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
              <AuthDebugPanel error={error} debug={debug} />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+250 7XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>

          <Collapsible open={showOtherRoles} onOpenChange={setShowOtherRoles}>
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-800 py-1"
            >
              {role === 'student' ? 'Register as lecturer or engineer' : `Account type: ${role}`}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showOtherRoles ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <p className="text-xs text-slate-500 text-center">
                Staff accounts require admin approval before you can sign in.
              </p>
              {(
                [
                  ['student', 'Student', 'Enroll in courses and programmes'],
                  ['lecturer', 'Lecturer', 'Teaching — admin approval required'],
                  ['engineer', 'Engineer', 'Community & support — admin approval required'],
                ] as const
              ).map(([value, title, desc]) => (
                <button
                  key={value}
                  type="button"
                  disabled={enrolling && value !== 'student'}
                  onClick={() => setRole(value)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition disabled:opacity-50 ${
                    role === value
                      ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-medium text-slate-900">{title}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Button
            type="submit"
            className="w-full h-11 bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account…' : enrolling ? 'Create account & continue' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <Link href={loginHref} className="font-medium text-[var(--brand-navy)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
          <RegisterForm />
        </Suspense>
      </div>
      <p className="text-center text-xs text-slate-400 pb-6">
        © {new Date().getFullYear()} {COMPANY.brandName}
      </p>
    </div>
  )
}
