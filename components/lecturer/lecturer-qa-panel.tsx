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
}

export function LecturerQAPanel({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<QA[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const load = () => {
    fetch(`/api/student/qa?courseId=${courseId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [courseId])

  const reply = async (questionId: string) => {
    const answer = (answers[questionId] ?? '').trim()
    if (!answer) return
    await fetch('/api/student/qa', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, questionId, answer }),
    })
    load()
  }

  const unanswered = items.filter((q) => !q.answer)

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-slate-900">
          <MessageCircleQuestion className="h-4 w-4" /> Student Q&amp;A
          {unanswered.length > 0 ? (
            <span className="text-xs font-normal text-amber-800">({unanswered.length} unanswered)</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No questions yet.</p>
        ) : (
          items.map((q) => (
            <div key={q.id} className="border rounded-lg p-3 text-sm space-y-2">
              <p className="font-medium text-slate-900">{q.question}</p>
              <p className="text-xs text-slate-500">{q.author_name}</p>
              {q.answer ? (
                <p className="text-slate-700 bg-slate-50 p-2 rounded">{q.answer}</p>
              ) : (
                <>
                  <Textarea
                    rows={2}
                    placeholder="Your answer"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                  <Button type="button" size="sm" onClick={() => reply(q.id)} className="bg-[var(--brand-navy)] text-white">
                    Post answer
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
