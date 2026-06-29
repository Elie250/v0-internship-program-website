'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { registerUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react'
import { AuthDebugPanel } from '@/components/auth/auth-debug-panel'
import type { AuthDebugInfo } from '@/lib/auth-debug'
import { COMPANY } from '@/lib/company/constants'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const enrolling = Boolean(redirectTo?.includes('/enroll'))

  const [role, setRole] = useState<'student' | 'lecturer' | 'engineer'>('student')
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
        setError('No response from server. Check /api/auth/health and try again.')
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
      const message = err instanceof Error ? err.message : String(err)
      setError(`Unexpected error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {enrolling ? (
        <div className="mb-4 rounded-lg border border-[var(--brand-navy)]/20 bg-[var(--brand-navy)]/5 p-4 flex gap-3">
          <GraduationCap className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-[var(--brand-navy)]">Create your account to enroll</p>
            <p className="text-muted-foreground mt-1">
              Register as a <strong>Student</strong>, then continue to payment and upload your MoMo receipt.
            </p>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">{COMPANY.brandName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Engineering Hub</p>
          </div>
          <CardTitle className="text-center">Create your account</CardTitle>
          <CardDescription className="text-center">
            Free registration — required before course enrollment
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">I am a…</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as typeof role)}>
                {(
                  [
                    ['student', 'Student', 'Enroll in courses and access learning materials'],
                    ['lecturer', 'Lecturer', 'Teaching and course delivery'],
                    ['engineer', 'Engineer', 'Technical support and engineering services'],
                  ] as const
                ).map(([value, title, desc]) => (
                  <div
                    key={value}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition"
                  >
                    <RadioGroupItem
                      value={value}
                      id={value}
                      disabled={enrolling && value !== 'student'}
                    />
                    <Label htmlFor={value} className="cursor-pointer flex-1 m-0">
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="text-sm text-slate-600">
                        {value === 'lecturer'
                          ? 'Requires admin approval before you can sign in. Permissions are set by an administrator.'
                          : value === 'engineer'
                            ? 'Requires admin approval before you can sign in.'
                            : desc}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {role === 'lecturer' || role === 'engineer' ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  Staff accounts are reviewed by {COMPANY.brandName}. You will not be logged in
                  automatically — an admin must approve your account and assign permissions.
                </div>
              ) : null}
            </div>

            {success ? (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            ) : null}

            {error ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
                <AuthDebugPanel error={error} debug={debug} />
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">Use the same email for MoMo payments</p>
              </div>

              <div>
                <Label htmlFor="phone">Phone / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="+250 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account…' : enrolling ? 'Create account & continue' : 'Create account'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href={
                  redirectTo
                    ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
                    : '/auth/login'
                }
                className="text-primary font-semibold hover:underline"
              >
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center p-4">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
