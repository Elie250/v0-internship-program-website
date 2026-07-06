'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircleQuestion } from 'lucide-react'

type QA = {
  id: string
  author_name: string
  question: string
  answer: string | null
  created_at: string
  answered_at: string | null
}

export function CourseQAPanel({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<QA[]>([])
  const [question, setQuestion] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch(`/api/student/qa?courseId=${courseId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [courseId])

  const ask = async () => {
    if (!question.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      setQuestion('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-slate-900">
          <MessageCircleQuestion className="h-4 w-4" /> Programme Q&amp;A
        </CardTitle>
        <p className="text-xs text-slate-500">Ask your lecturer — answers appear here for the class.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="space-y-2">
          <Textarea rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Your question…" />
          <Button type="button" size="sm" onClick={ask} disabled={saving} className="bg-[var(--brand-navy)] text-white">
            {saving ? 'Posting…' : 'Ask question'}
          </Button>
        </div>
        <ul className="space-y-3">
          {items.map((q) => (
            <li key={q.id} className="border rounded-lg p-3 text-sm space-y-2">
              <p className="font-medium text-slate-900">{q.question}</p>
              <p className="text-xs text-slate-500">{q.author_name} · {new Date(q.created_at).toLocaleString()}</p>
              {q.answer ? (
                <div className="bg-slate-50 rounded p-2 text-slate-700">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Lecturer answer</p>
                  {q.answer}
                </div>
              ) : (
                <p className="text-xs text-amber-800">Awaiting lecturer answer</p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
