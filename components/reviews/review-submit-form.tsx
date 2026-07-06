'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StarRatingInput } from '@/components/reviews/star-rating'
import { REVIEW_CONTEXTS, type ReviewContext } from '@/lib/reviews/types'
import { Send } from 'lucide-react'

type Props = {
  defaultName?: string
  defaultEmail?: string
  defaultContext?: ReviewContext
  compact?: boolean
}

export function ReviewSubmitForm({
  defaultName = '',
  defaultEmail = '',
  defaultContext = 'general',
  compact = false,
}: Props) {
  const [rating, setRating] = useState(0)
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [context, setContext] = useState<ReviewContext>(defaultContext)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Please select a star rating')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName: name, reviewerEmail: email, rating, title, comment, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setSuccess(data.message ?? 'Review submitted!')
      setRating(0)
      setTitle('')
      setComment('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 app-form-surface">
      <div>
        <Label className="text-slate-800">Your rating *</Label>
        <div className="mt-2">
          <StarRatingInput value={rating} onChange={setRating} disabled={loading} />
        </div>
      </div>

      {!compact ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-800">Your name *</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label className="text-slate-800">Email *</Label>
            <Input
              type="email"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
      ) : null}

      <div>
        <Label className="text-slate-800">What did you use? *</Label>
        <Select value={context} onValueChange={(v) => setContext(v as ReviewContext)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_CONTEXTS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-slate-800">Headline (optional)</Label>
        <Input
          className="mt-1"
          placeholder="e.g. Excellent hands-on training"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </div>

      <div>
        <Label className="text-slate-800">Your review *</Label>
        <Textarea
          className="mt-1"
          rows={compact ? 4 : 5}
          placeholder="Share your experience with Energy & Logics — what went well, what you learned, and how it helped you."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          minLength={20}
        />
        <p className="text-xs text-slate-500 mt-1">Minimum 20 characters. Reviews are moderated before publishing.</p>
      </div>

      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{success}</p>
      ) : null}

      <Button
        type="submit"
        disabled={loading || rating < 1}
        className="bg-[var(--brand-navy)] text-white"
      >
        <Send className="h-4 w-4 mr-2" />
        {loading ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  )
}
