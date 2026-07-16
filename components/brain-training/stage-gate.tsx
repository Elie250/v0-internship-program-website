'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'

type Props = {
  level: number
  levelLabel: string
  passed: boolean
  correct: number
  total: number
  accuracy: number
  hasNextStage: boolean
  onContinue: () => void
  onRetry: () => void
  onFinish: () => void
}

/** Simple pass / retry interstitial between stages. */
export function StageGate({
  level,
  levelLabel,
  passed,
  correct,
  total,
  accuracy,
  hasNextStage,
  onContinue,
  onRetry,
  onFinish,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stage-gate-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div
          className={`px-5 pt-6 pb-4 text-center ${
            passed
              ? 'bg-gradient-to-b from-emerald-50 to-white'
              : 'bg-gradient-to-b from-amber-50 to-white'
          }`}
        >
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
              passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {passed ? <CheckCircle2 className="h-8 w-8" /> : <RotateCcw className="h-7 w-7" />}
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Stage {level} · {levelLabel}
          </p>
          <h2 id="stage-gate-title" className="mt-1 text-2xl font-black text-slate-900">
            {passed ? (hasNextStage ? 'Stage cleared!' : 'All stages cleared!') : 'Almost — try again'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {passed
              ? hasNextStage
                ? 'Nice work. Confirm to open the next stage.'
                : 'You finished the full run. See your score.'
              : 'Need about 70% correct to unlock the next stage.'}
          </p>
        </div>

        <div className="px-5 py-4 grid grid-cols-3 gap-2 text-center">
          <Metric label="Correct" value={`${correct}/${total}`} />
          <Metric label="Accuracy" value={`${accuracy}%`} highlight={passed} />
          <Metric label="Marks" value={passed ? 'PASS' : 'RETRY'} highlight={passed} />
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2">
          {passed ? (
            <>
              <Button
                className="h-12 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                onClick={hasNextStage ? onContinue : onFinish}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {hasNextStage ? 'Continue to next stage' : 'See final score'}
              </Button>
              {hasNextStage ? (
                <Button variant="ghost" className="h-10 text-slate-600" onClick={onFinish}>
                  End run & see score
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                className="h-12 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                onClick={onRetry}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry this stage
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border-slate-300" onClick={onFinish}>
                End run & see score
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-2 py-3 ${
        highlight
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-slate-200 bg-slate-50 text-slate-800'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}
