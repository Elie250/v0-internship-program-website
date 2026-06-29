'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Your details' },
  { id: 2, label: 'Payment info' },
  { id: 3, label: 'Upload receipt' },
  { id: 4, label: 'Submit' },
] as const

export function EnrollmentSteps({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex flex-wrap gap-2 mb-8">
      {STEPS.map((step) => {
        const done = step.id < currentStep
        const active = step.id === currentStep
        return (
          <li
            key={step.id}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
              done && 'bg-green-50 border-green-200 text-green-800',
              active && 'bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white',
              !done && !active && 'bg-white border-slate-200 text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                done && 'bg-green-600 text-white',
                active && 'bg-white text-[var(--brand-navy)]',
                !done && !active && 'bg-slate-100 text-slate-500'
              )}
            >
              {done ? <Check className="h-3 w-3" /> : step.id}
            </span>
            {step.label}
          </li>
        )
      })}
    </ol>
  )
}
