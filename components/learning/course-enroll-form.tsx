'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { COMPANY, PAYMENT } from '@/lib/company/constants'
import { CheckCircle2, Smartphone } from 'lucide-react'
import type { Course } from '@/types/platform'

export function CourseEnrollForm({ course }: { course: Course }) {
  const [form, setForm] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/learning/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSuccess(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-700 shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Application submitted</p>
              <p className="text-sm text-green-800 mt-1">{success}</p>
              <p className="text-sm text-green-800 mt-2">
                We will verify your MoMo receipt and contact you at {form.applicantEmail} or {form.applicantPhone}.
              </p>
            </div>
          </div>
          <Link href="/learning">
            <Button variant="outline">Back to courses</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your contact details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              className="mt-1"
              value={form.applicantName}
              onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              className="mt-1"
              value={form.applicantEmail}
              onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input
              id="phone"
              required
              className="mt-1"
              placeholder="+250..."
              value={form.applicantPhone}
              onChange={(e) => setForm({ ...form, applicantPhone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="motivation">Why this programme? (optional)</Label>
            <Textarea
              id="motivation"
              className="mt-1"
              value={form.motivation}
              onChange={(e) => setForm({ ...form, motivation: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#1e3a5f]/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-[#1e3a5f]" />
            <CardTitle className="text-lg">Payment — {PAYMENT.method}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Amount due for {course.title}</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">
              {price > 0 ? `${price.toLocaleString()} RWF` : 'Contact us for pricing'}
            </p>
            <p className="text-sm mt-2">
              MoMo Pay Code: <strong>{PAYMENT.momoPayCode}</strong> · {PAYMENT.accountName}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{PAYMENT.workflow}</p>
          <Link href="/payment-instructions" className="text-sm text-[#1e3a5f] underline">
            Full payment instructions
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload payment receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="receipt">MoMo receipt (screenshot or PDF)</Label>
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
            {uploading ? <p className="text-xs text-muted-foreground mt-1">Uploading…</p> : null}
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
            <div className="relative h-32 w-full rounded border overflow-hidden bg-muted">
              {form.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer" className="p-4 text-sm underline block">
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
            />
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" className="w-full bg-[#1e3a5f]" disabled={submitting || uploading}>
        Submit application & receipt
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        {COMPANY.brandName} will review your receipt manually. Admission is confirmed after payment verification.
      </p>
    </form>
  )
}
