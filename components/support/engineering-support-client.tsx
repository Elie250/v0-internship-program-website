'use client'

import { useState } from 'react'
import { EngineeringSupportPortal } from '@/components/support/engineering-support-portal'
import type { SupportSubscriptionPlan } from '@/lib/support/types'
import type { SupportAccessSummary } from '@/lib/support/types'

interface Category {
  id: string
  name: string
}

export function EngineeringSupportClient({
  categories,
  plans,
  initialAccess,
  isLoggedIn,
}: {
  categories: Category[]
  plans: SupportSubscriptionPlan[]
  initialAccess: SupportAccessSummary | null
  isLoggedIn: boolean
}) {
  const [selectedPlan, setSelectedPlan] = useState<SupportSubscriptionPlan | null>(null)
  const [access, setAccess] = useState(initialAccess)

  const refreshAccess = async () => {
    try {
      const res = await fetch('/api/support/subscribe', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setAccess(data)
      }
    } catch {
      // ignore
    }
  }

  return (
    <EngineeringSupportPortal
      categories={categories}
      plans={plans}
      access={access}
      isLoggedIn={isLoggedIn}
      selectedPlan={selectedPlan}
      onSelectPlan={setSelectedPlan}
      onSubscriptionChange={refreshAccess}
    />
  )
}
