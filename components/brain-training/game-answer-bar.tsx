'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Flash = 'correct' | 'incorrect' | null

type Props = {
  prompt: string
  onYes: () => void
  onNo: () => void
  disabled?: boolean
  flash?: Flash
  showShortcuts?: boolean
  className?: string
}

export function GameAnswerBar({
  prompt,
  onYes,
  onNo,
  disabled,
  flash,
  showShortcuts = true,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 px-4',
        'md:static md:z-auto md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:pb-0',
        className
      )}
    >
      <p className="text-center text-sm sm:text-base font-semibold text-slate-900 mb-3 md:mb-4 px-1">
        {prompt}
      </p>
      <div
        className={cn(
          'grid grid-cols-2 gap-3 max-w-xl mx-auto transition-colors duration-150 rounded-xl',
          flash === 'correct' && 'ring-2 ring-emerald-500/80 bg-emerald-50/80',
          flash === 'incorrect' && 'ring-2 ring-red-500/80 bg-red-50/80'
        )}
      >
        <Button
          type="button"
          size="lg"
          disabled={disabled}
          className="h-14 sm:h-16 text-base sm:text-lg font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white touch-manipulation select-none"
          style={{ touchAction: 'manipulation' }}
          onClick={onYes}
          aria-keyshortcuts="y ArrowRight"
        >
          YES
          {showShortcuts && (
            <kbd className="ml-2 hidden md:inline-flex rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
              Y
            </kbd>
          )}
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={disabled}
          className="h-14 sm:h-16 text-base sm:text-lg font-bold bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white touch-manipulation select-none"
          style={{ touchAction: 'manipulation' }}
          onClick={onNo}
          aria-keyshortcuts="n ArrowLeft"
        >
          NO
          {showShortcuts && (
            <kbd className="ml-2 hidden md:inline-flex rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
              N
            </kbd>
          )}
        </Button>
      </div>
      {showShortcuts && (
        <p className="hidden md:block text-center text-xs text-slate-500 mt-2">
          Keyboard: <kbd className="font-mono">Y</kbd> / <kbd className="font-mono">→</kbd> Yes ·{' '}
          <kbd className="font-mono">N</kbd> / <kbd className="font-mono">←</kbd> No
        </p>
      )}
    </div>
  )
}
