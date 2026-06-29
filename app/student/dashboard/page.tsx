'use client'

import { Suspense } from 'react'
import StudentDashboardInner from './dashboard-inner'

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-muted-foreground">Loading your courses…</p>
        </div>
      }
    >
      <StudentDashboardInner />
    </Suspense>
  )
}
