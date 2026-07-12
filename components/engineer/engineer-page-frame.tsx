'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import type { SupportAccessSummary } from '@/lib/support/types'
import { EngineerPortalShell } from '@/components/engineer/engineer-portal-shell'

export function EngineerPageFrame({
  children,
  title,
  description,
  headerAction,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  headerAction?: React.ReactNode
}) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [supportAccess, setSupportAccess] = useState<SupportAccessSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user || user.role !== 'engineer') {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Engineer'
      )

      const [accessRes, profileRes] = await Promise.all([
        fetch('/api/support/subscribe', { credentials: 'same-origin' }),
        fetch('/api/engineer/profile', { credentials: 'same-origin' }),
      ])

      if (accessRes.ok) setSupportAccess(await accessRes.json())
      if (profileRes.ok) {
        const profile = await profileRes.json()
        setPhotoUrl(profile.profile_photo_url ?? null)
      }

      setLoading(false)
    }
    void init()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading engineer portal…</p>
      </div>
    )
  }

  return (
    <EngineerPortalShell
      userName={userName}
      photoUrl={photoUrl}
      supportAccess={supportAccess}
      title={title}
      description={description}
      headerAction={headerAction}
    >
      {children}
    </EngineerPortalShell>
  )
}
