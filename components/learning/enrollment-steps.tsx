'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const PAID_STEPS = [
  { id: 1, label: 'Your details' },
  { id: 2, label: 'Payment info' },
  { id: 3, label: 'Upload receipt' },
  { id: 4, label: 'Submit' },
] as const

const FREE_STEPS = [
  { id: 1, label: 'Your details' },
  { id: 2, label: 'Confirm' },
] as const

export function EnrollmentSteps({
  currentStep,
  isFree = false,
}: {
  currentStep: number
  isFree?: boolean
}) {
  const steps = isFree ? FREE_STEPS : PAID_STEPS
  const displayStep = isFree && currentStep >= 4 ? 2 : isFree && currentStep > 1 ? 2 : currentStep

  return (
    <ol className="flex flex-wrap gap-2 mb-8">
      {steps.map((step) => {
        const done = step.id < displayStep
        const active = step.id === displayStep
        return (
          <li
            key={step.id}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
              done && 'bg-green-50 border-green-200 text-green-800',
              active && 'bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white',
              !done && !active && 'bg-white border-slate-200 text-slate-600'
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
