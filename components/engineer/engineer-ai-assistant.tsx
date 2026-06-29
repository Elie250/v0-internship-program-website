'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles } from 'lucide-react'
import type { SupportAccessSummary } from '@/lib/support/types'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function EngineerAiAssistant({ access }: { access: SupportAccessSummary | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(access?.aiMessagesRemaining ?? null)

  const canUse = access?.canUseAiAssistant && access?.hasActiveSubscription

  const send = async () => {
    const text = input.trim()
    if (!text || !canUse) return
    setLoading(true)
    setError('')
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    try {
      const res = await fetch('/api/support/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI request failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      if (data.aiMessagesRemaining != null) setRemaining(data.aiMessagesRemaining)
      if (data.usedFallback) {
        setError('Running in guided mode — set OPENAI_API_KEY on the server for full AI answers.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  if (!canUse && !access?.hasActiveSubscription) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <Bot className="h-10 w-10 mx-auto text-slate-400" />
          <p className="text-slate-700">Subscribe to use the technical AI assistant.</p>
          <Button asChild><Link href="/engineering-support">Get a plan</Link></Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI technical assistant
          </h2>
          <p className="text-sm text-slate-600">
            Quick guidance on PLC, electrical, and embedded questions before opening a ticket.
          </p>
        </div>
        {remaining != null ? (
          <Badge variant="outline">{remaining} AI messages left</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-800">Unlimited AI</Badge>
        )}
      </div>

      <Card className="min-h-[360px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="flex-1 space-y-3 max-h-80 overflow-y-auto rounded-lg bg-muted/40 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask about fault codes, wiring, ladder logic, sensor selection, etc.
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-white border text-slate-800'
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
          </div>
          {error ? <p className="text-xs text-amber-700">{error}</p> : null}
          {!canUse ? (
            <p className="text-sm text-destructive">AI message limit reached. Upgrade your plan.</p>
          ) : null}
          <div className="flex gap-2">
            <Textarea
              placeholder="Describe your technical issue…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              disabled={!canUse || loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <Button onClick={send} disabled={!canUse || loading || !input.trim()} className="shrink-0">
              {loading ? '…' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
