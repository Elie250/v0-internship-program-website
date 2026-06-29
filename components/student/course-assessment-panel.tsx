'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CourseAssessmentPanel({
  enrollmentId,
  courseTitle,
}: {
  enrollmentId: string
  courseTitle: string
}) {
  const [score, setScore] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    const res = await fetch('/api/student/assessment', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId, score: Number(score) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Submission failed')
      return
    }
    setMessage(
      data.passed
        ? 'Score submitted — passed. Your lecturer and admin will confirm before your certificate is issued.'
        : 'Score submitted — below passing grade. Contact your instructor to retake.'
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Final assessment — {courseTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Enter your assessment score (0–100). Passing is typically 70%. Lecturer and admin must
          confirm before a certificate is generated for paid programmes.
        </p>
        <div>
          <Label htmlFor="assessment-score">Your score (%)</Label>
          <Input
            id="assessment-score"
            type="number"
            min={0}
            max={100}
            className="mt-1 max-w-xs"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-green-800">{message}</p> : null}
        <Button
          type="button"
          className="bg-[var(--brand-navy)] text-white"
          disabled={loading || !score}
          onClick={submit}
        >
          {loading ? 'Submitting…' : 'Submit score'}
        </Button>
      </CardContent>
    </Card>
  )
}
