'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser } from '@/app/actions/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthDebugPanel } from '@/components/auth/auth-debug-panel';
import type { AuthDebugInfo } from '@/lib/auth-debug';
import { COMPANY } from '@/lib/company/constants';

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'student' | 'lecturer' | 'engineer' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debug, setDebug] = useState<AuthDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('message') === 'registered') {
      setSuccess('Account created. You can log in with your email and password.');
    }
    if (searchParams.get('redirect')?.includes('/enroll')) {
      setSuccess((prev) => prev || 'Log in with your student account to continue enrollment.');
    }
  }, [searchParams]);

  const redirectTo = searchParams.get('redirect');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDebug(null);
    setIsLoading(true);

    try {
      const result = await loginUser(email, password, role);

      if (result.success) {
        const dest =
          redirectTo && redirectTo.startsWith('/') ? redirectTo : (result.redirectTo ?? '/dashboard');
        router.push(dest);
        router.refresh();
      } else {
        setError(result.error || 'Login failed');
        setDebug(result.debug ?? null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Unexpected error: ${message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-3">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary">Energy & Logics</h1>
              <p className="text-sm text-muted-foreground mt-1">Engineering Academy</p>
            </div>
            <CardTitle className="text-center">Login to Your Account</CardTitle>
            <CardDescription className="text-center">
              Select your role and enter your credentials
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Select Your Role</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as any)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="cursor-pointer flex-1 m-0">
                      <div>
                        <p className="font-semibold">Student</p>
                        <p className="text-sm text-muted-foreground">Access courses and materials</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition">
                    <RadioGroupItem value="lecturer" id="lecturer" />
                    <Label htmlFor="lecturer" className="cursor-pointer flex-1 m-0">
                      <div>
                        <p className="font-semibold">Lecturer</p>
                        <p className="text-sm text-muted-foreground">Manage courses and students</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition">
                    <RadioGroupItem value="engineer" id="engineer" />
                    <Label htmlFor="engineer" className="cursor-pointer flex-1 m-0">
                      <div>
                        <p className="font-semibold">Engineer</p>
                        <p className="text-sm text-muted-foreground">View technical resources</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="cursor-pointer flex-1 m-0">
                      <div>
                        <p className="font-semibold">Administrator</p>
                        <p className="text-sm text-muted-foreground">Manage the entire platform</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                  <AuthDebugPanel error={error} debug={debug} />
                </div>
              )}

              {/* Login Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              {/* Links */}
              <div className="text-center space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link
                    href={
                      redirectTo
                        ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}`
                        : '/auth/register'
                    }
                    className="text-primary font-semibold hover:underline"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>{COMPANY.brandName} Engineering Training © {new Date().getFullYear()}</p>
          <p>
            <Link href="/api/auth/health" target="_blank" className="underline">
              Open auth health check (share JSON if login fails)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
