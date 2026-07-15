'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type Props = {
  secondsLeft: number
  totalSeconds: number
  className?: string
}

export function GameTimer({ secondsLeft, totalSeconds, className }: Props) {
  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0
  const urgent = secondsLeft <= 1.5

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Time</span>
        <span
          className={cn(
            'font-mono font-bold tabular-nums text-base sm:text-sm',
            urgent ? 'text-red-600' : 'text-slate-900'
          )}
        >
          {secondsLeft.toFixed(1)}s
        </span>
      </div>
      <Progress
        value={pct}
        className={cn('h-2.5 sm:h-2', urgent ? '[&>div]:bg-red-500' : '[&>div]:bg-[var(--brand-navy)]')}
      />
    </div>
  )
}
