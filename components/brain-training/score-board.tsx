'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { rankLabel, xpFromScore } from '@/lib/brain-training/scoring'

type Props = {
  accuracy: number
  averageResponseMs: number
  score: number
  levelCompleted: number
  correctCount: number
  totalQuestions: number
  saved?: boolean
  guest?: boolean
  onPlayAgain: () => void
  onBack: () => void
}

export function ScoreBoard({
  accuracy,
  averageResponseMs,
  score,
  levelCompleted,
  correctCount,
  totalQuestions,
  saved,
  guest,
  onPlayAgain,
  onBack,
}: Props) {
  const rank = rankLabel(accuracy, averageResponseMs)
  const xp = xpFromScore(score)
  const reactionSec = (averageResponseMs / 1000).toFixed(2)

  return (
    <Card className="border-slate-200 shadow-sm max-w-lg mx-auto">
      <CardHeader className="text-center pb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
          Performance report
        </p>
        <CardTitle className="text-2xl text-slate-900">Your result</CardTitle>
        <p className="text-sm text-slate-600">
          {correctCount}/{totalQuestions} correct · Level {levelCompleted}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Accuracy" value={`${accuracy}%`} />
          <Metric label="Reaction speed" value={`${reactionSec} s`} />
          <Metric label="Score" value={`${xp} XP`} />
          <Metric label="Rank" value={rank} highlight />
        </div>

        {guest ? (
          <p className="text-xs text-center text-slate-600 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            Guest session — score is not saved permanently.{' '}
            <a href="/auth/login" className="font-semibold text-[var(--brand-navy)] underline">
              Log in as a student
            </a>{' '}
            to track progress and rankings.
          </p>
        ) : saved ? (
          <p className="text-xs text-center text-emerald-800 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            Session saved to your Brain Training profile.
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            onClick={onPlayAgain}
          >
            Play again
          </Button>
          <Button variant="outline" className="flex-1 border-slate-300" onClick={onBack}>
            Back to Academy
          </Button>
        </div>
      </CardContent>
    </Card>
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
      className={`rounded-lg border px-3 py-3 text-center ${
        highlight
          ? 'border-[var(--brand-navy)]/30 bg-[var(--brand-navy)]/5'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
