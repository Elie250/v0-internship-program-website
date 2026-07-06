'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Mail, Send } from 'lucide-react'
import { USER_ROLES } from '@/lib/admin/user-roles'
import { ROLE_LABELS } from '@/types/platform'

type UserOption = {
  id: string
  email: string
  firstName: string
  lastName: string
}

type RecipientMode = 'single' | 'role' | 'all_students' | 'emails'

export default function AdminCommunicationsTab() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [mode, setMode] = useState<RecipientMode>('single')
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('student')
  const [customEmails, setCustomEmails] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users?role=student', { credentials: 'same-origin' })
    const data = await res.json()
    if (res.ok && Array.isArray(data)) {
      setUsers(
        data.map((u: { id: string; email: string; first_name: string; last_name: string }) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name ?? '',
          lastName: u.last_name ?? '',
        }))
      )
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleSend = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const emails =
        mode === 'emails'
          ? customEmails
              .split(/[\n,;]+/)
              .map((e) => e.trim())
              .filter(Boolean)
          : undefined

      const res = await fetch('/api/admin/communications/email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          userId: mode === 'single' ? userId : undefined,
          role: mode === 'role' ? role : undefined,
          emails,
          subject,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send email')
      setSuccess(data.message ?? 'Email sent successfully.')
      if (mode !== 'emails') {
        setSubject('')
        setMessage('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 app-form-surface">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email communications
        </h1>
        <p className="text-slate-600 mt-1">
          Send customized messages to students or user groups. Compose your own subject and body —
          nothing is hardcoded.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Compose email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{success}</p>
          ) : null}

          <div>
            <Label>Recipients</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as RecipientMode)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">One student</SelectItem>
                <SelectItem value="all_students">All active students</SelectItem>
                <SelectItem value="role">By role</SelectItem>
                <SelectItem value="emails">Custom email list</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'single' ? (
            <div>
              <Label>Student</Label>
              <Select value={userId || 'none'} onValueChange={(v) => setUserId(v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {mode === 'role' ? (
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {mode === 'emails' ? (
            <div>
              <Label>Email addresses</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="One per line, or separated by commas"
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
              />
            </div>
          ) : null}

          <div>
            <Label>Subject</Label>
            <Input
              className="mt-1"
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              className="mt-1"
              rows={8}
              placeholder="Write your message here. Line breaks are preserved in the email."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button
            className="bg-[var(--brand-navy)] text-white"
            onClick={handleSend}
            disabled={loading || !subject.trim() || !message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending…' : 'Send email'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
