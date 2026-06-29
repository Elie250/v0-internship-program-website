'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EnrollmentSteps } from '@/components/learning/enrollment-steps'
import { COMPANY, PAYMENT } from '@/lib/company/constants'
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react'
import type { Course } from '@/types/platform'

export type EnrollUser = {
  firstName?: string
  lastName?: string
  email: string
  phone?: string | null
}

export function CourseEnrollForm({ course, user }: { course: Course; user: EnrollUser }) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    applicantPhone: user.phone ?? '',
    motivation: '',
    receiptUrl: '',
    receiptNumber: '',
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const price = Number(course.pricing ?? 0)

  const handleReceiptUpload = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/public/upload-receipt', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.hint ? `${data.error} — ${data.hint}` : data.error)
      setForm((prev) => ({ ...prev, receiptUrl: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/learning/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          applicantPhone: form.applicantPhone,
          motivation: form.motivation,
          receiptUrl: form.receiptUrl,
          receiptNumber: form.receiptNumber,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSuccess(data.message)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 shadow-sm">
        <CardContent className="pt-8 pb-8 space-y-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-900">Enrollment submitted</h2>
            <p className="text-sm text-green-800 mt-2 max-w-md mx-auto">{success}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border text-left p-4 max-w-md mx-auto space-y-2 text-sm">
            <p className="font-medium text-[var(--brand-navy)]">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Our team verifies your MoMo receipt (within 1 business day)</li>
              <li>You receive confirmation by email or WhatsApp</li>
              <li>Course materials unlock on your student dashboard</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/student/dashboard">
              <Button className="bg-[var(--brand-navy)]">Go to my dashboard</Button>
            </Link>
            <Link href="/learning">
              <Button variant="outline">Browse more courses</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <EnrollmentSteps currentStep={step} />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--brand-navy)]" />
              <CardTitle>Your account details</CardTitle>
            </div>
            <CardDescription>
              Pulled from your logged-in account. Update your phone if needed for MoMo verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 rounded-lg bg-slate-50 border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Full name</p>
                <p className="font-medium">{displayName}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                <p className="font-medium text-sm break-all">{user.email}</p>
              </div>
              <div>
                <Label htmlFor="phone">Phone / WhatsApp *</Label>
                <Input
                  id="phone"
                  required
                  className="mt-1"
                  placeholder="+250 7XX XXX XXX"
                  value={form.applicantPhone}
                  onChange={(e) => setForm({ ...form, applicantPhone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Must match your MoMo payment number</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="motivation">Why this programme? (optional)</Label>
                <Textarea
                  id="motivation"
                  className="mt-1"
                  placeholder="Tell us about your background and goals…"
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                />
              </div>
            </div>
            <Button
              className="w-full bg-[var(--brand-navy)]"
              disabled={!form.applicantPhone.trim()}
              onClick={() => setStep(2)}
            >
              Continue to payment
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="shadow-sm border-[var(--brand-navy)]/15">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[var(--brand-navy)]" />
              <CardTitle>Pay with MTN MoMo</CardTitle>
            </div>
            <CardDescription>{PAYMENT.workflow}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-[var(--brand-navy)]/5 border border-[var(--brand-navy)]/10 p-5">
              <p className="text-sm text-muted-foreground">Amount due — {course.title}</p>
              <p className="text-3xl font-bold text-[var(--brand-navy)] mt-1">
                {price > 0 ? `${price.toLocaleString()} RWF` : 'Contact us'}
              </p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">MoMo Pay Code</p>
                  <p className="font-bold text-lg">{PAYMENT.momoPayCode}</p>
                </div>
                <div className="bg-white rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Account name</p>
                  <p className="font-semibold">{PAYMENT.accountName}</p>
                </div>
              </div>
            </div>
            <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
              {PAYMENT.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <Link href="/payment-instructions" className="text-sm text-[var(--brand-navy)] underline inline-block">
              Full payment instructions →
            </Link>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 bg-[var(--brand-navy)]" onClick={() => setStep(3)}>
                I have paid — upload receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--brand-navy)]" />
              <CardTitle>Upload payment receipt</CardTitle>
            </div>
            <CardDescription>
              Upload your MoMo confirmation screenshot or PDF so {COMPANY.brandName} can verify payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt">Receipt file *</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                className="mt-1"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleReceiptUpload(file)
                }}
              />
              {uploading ? (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="receiptUrl">Or paste receipt URL</Label>
              <Input
                id="receiptUrl"
                className="mt-1"
                value={form.receiptUrl}
                onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            {form.receiptUrl ? (
              <div className="relative h-32 w-full rounded-lg border overflow-hidden bg-muted">
                {form.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                  <a
                    href={form.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 text-sm underline block"
                  >
                    View uploaded PDF receipt
                  </a>
                ) : (
                  <Image src={form.receiptUrl} alt="Receipt preview" fill className="object-contain" unoptimized />
                )}
              </div>
            ) : null}
            <div>
              <Label htmlFor="receiptNumber">MoMo transaction reference (optional)</Label>
              <Input
                id="receiptNumber"
                className="mt-1"
                value={form.receiptNumber}
                onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                placeholder="e.g. TXN123456789"
              />
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Verification usually takes one business day. Track status on your student dashboard.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="flex-1 bg-[var(--brand-navy)]"
                disabled={submitting || uploading || !form.receiptUrl}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit enrollment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
