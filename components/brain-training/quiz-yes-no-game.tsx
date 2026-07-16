'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameTimer } from '@/components/brain-training/timer'
import { ScoreBoard } from '@/components/brain-training/score-board'
import { GameAnswerBar } from '@/components/brain-training/game-answer-bar'
import { GameLaunchScreen } from '@/components/brain-training/game-launch-screen'
import {
  feedbackPulse,
  useLockBodyScroll,
  usePrefersReducedMotion,
  useTouchPlayLayout,
  useYesNoShortcuts,
} from '@/components/brain-training/use-brain-play'
import {
  QUIZ_LEVELS,
  computeScore,
  playSeconds,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'
import { StageRail } from '@/components/brain-training/stage-rail'
import { getGameDef, type BrainGameSlug } from '@/lib/brain-training/catalog'
import {
  pickQuizRound,
  type QuizBankId,
  type QuizItem,
} from '@/lib/brain-training/question-banks'
import { cn } from '@/lib/utils'
import type { DrillPhase } from '@/components/brain-training/types'
import { trackBrainEngagement } from '@/lib/brain-training/client-engagement'

type Flash = 'correct' | 'incorrect' | null

type Props = {
  gameSlug: BrainGameSlug
  bankId: QuizBankId
  backHref: string
  canPersist: boolean
  onPersist?: (result: GameResultPayload) => Promise<boolean>
  onPhaseChange?: (phase: DrillPhase) => void
}

export function QuizYesNoGame({
  gameSlug,
  bankId,
  backHref,
  canPersist,
  onPersist,
  onPhaseChange,
}: Props) {
  const router = useRouter()
  const def = getGameDef(gameSlug)
  const touchLayout = useTouchPlayLayout()
  const reducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<DrillPhase>('intro')
  const [level, setLevel] = useState(1)
  const [index, setIndex] = useState(0)
  const [deck, setDeck] = useState<QuizItem[]>([])
  const [secondsLeft, setSecondsLeft] = useState(6)
  const [correct, setCorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [saved, setSaved] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const [coachLine, setCoachLine] = useState<string | null>(null)
  const startedAt = useRef(0)
  const sessionStart = useRef(0)
  const answering = useRef(false)
  const sessionClosed = useRef(false)
  const flashTimer = useRef<number | null>(null)

  const setDrillPhase = useCallback(
    (next: DrillPhase) => {
      setPhase(next)
      onPhaseChange?.(next)
      if (next === 'playing') {
        trackBrainEngagement('open', gameSlug, { isGuest: !canPersist })
      } else if (next === 'result') {
        trackBrainEngagement('complete', gameSlug, { isGuest: !canPersist })
      }
    },
    [onPhaseChange, canPersist, gameSlug]
  )

  useLockBodyScroll(phase === 'playing')

  const levelConfig = QUIZ_LEVELS[Math.max(0, Math.min(level, QUIZ_LEVELS.length) - 1)]!
  const seconds = playSeconds(levelConfig.seconds, touchLayout)
  const progressPct = ((index + (phase === 'playing' ? 1 : 0)) / levelConfig.questions) * 100
  const challenge = deck[index] ?? null
  const flashMs = reducedMotion ? 0 : challenge?.explain ? 1100 : 160

  const result = useMemo(() => {
    const computed = computeScore({
      correct,
      total: times.length,
      responseTimesMs: times,
      maxPerQuestionMs: seconds * 1000,
    })
    return {
      ...computed,
      levelCompleted: level,
      correctCount: correct,
      totalQuestions: times.length,
    }
  }, [correct, times, seconds, level])

  const clearFlashTimer = () => {
    if (flashTimer.current != null) {
      window.clearTimeout(flashTimer.current)
      flashTimer.current = null
    }
  }

  const startLevel = useCallback(
    (nextLevel: number) => {
      clearFlashTimer()
      const cfg = QUIZ_LEVELS[Math.max(0, Math.min(nextLevel, QUIZ_LEVELS.length) - 1)]!
      const nextSeconds = playSeconds(cfg.seconds, touchLayout)
      sessionClosed.current = false
      setLevel(nextLevel)
      setIndex(0)
      setCorrect(0)
      setTimes([])
      setSaved(false)
      setFlash(null)
      setCoachLine(null)
      setDeck(pickQuizRound(bankId, cfg.questions, nextLevel))
      sessionStart.current = Date.now()
      setSecondsLeft(nextSeconds)
      startedAt.current = Date.now()
      answering.current = false
      setDrillPhase('playing')
    },
    [bankId, touchLayout, setDrillPhase]
  )

  const finish = useCallback(
    async (finalCorrect: number, finalTimes: number[], finalLevel: number) => {
      if (sessionClosed.current) return
      sessionClosed.current = true
      answering.current = false
      clearFlashTimer()
      setFlash(null)
      setCoachLine(null)
      setCorrect(finalCorrect)
      setTimes(finalTimes)
      setLevel(finalLevel)
      setDrillPhase('result')

      const cfg = QUIZ_LEVELS[Math.max(0, Math.min(finalLevel, QUIZ_LEVELS.length) - 1)]!
      const maxMs = playSeconds(cfg.seconds, touchLayout) * 1000
      const computed = computeScore({
        correct: finalCorrect,
        total: Math.max(1, finalTimes.length),
        responseTimesMs: finalTimes,
        maxPerQuestionMs: maxMs,
      })
      if (canPersist && onPersist) {
        try {
          const ok = await onPersist({
            gameSlug,
            score: computed.score,
            accuracy: computed.accuracy,
            averageResponseMs: computed.averageResponseMs,
            timeTakenMs: Math.max(0, Date.now() - (sessionStart.current || Date.now())),
            levelCompleted: finalLevel,
            correctCount: finalCorrect,
            totalQuestions: finalTimes.length,
          })
          setSaved(Boolean(ok))
        } catch {
          setSaved(false)
        }
      }
    },
    [canPersist, onPersist, touchLayout, setDrillPhase, gameSlug]
  )

  const exitSession = useCallback(() => {
    clearFlashTimer()
    setFlash(null)
    setCoachLine(null)
    if (times.length > 0 && phase === 'playing') {
      void finish(correct, times, level)
      return
    }
    answering.current = false
    setDrillPhase('intro')
  }, [times, phase, correct, level, finish, setDrillPhase])

  const advance = useCallback(
    (wasCorrect: boolean, responseMs: number) => {
      if (answering.current || sessionClosed.current || phase !== 'playing') return
      answering.current = true
      feedbackPulse(wasCorrect)
      const nextCorrect = correct + (wasCorrect ? 1 : 0)
      const nextTimes = [...times, responseMs]
      const nextIndex = index + 1
      const tip = challenge?.explain ?? null

      const afterFlash = () => {
        setFlash(null)
        setCoachLine(null)
        if (nextIndex >= levelConfig.questions) {
          const acc = nextTimes.length > 0 ? nextCorrect / nextTimes.length : 0
          if (acc >= 0.7 && level < QUIZ_LEVELS.length) {
            answering.current = false
            startLevel(level + 1)
            return
          }
          void finish(nextCorrect, nextTimes, level)
          return
        }
        setCorrect(nextCorrect)
        setTimes(nextTimes)
        setIndex(nextIndex)
        setSecondsLeft(seconds)
        startedAt.current = Date.now()
        answering.current = false
      }

      setFlash(wasCorrect ? 'correct' : 'incorrect')
      setCoachLine(tip)
      clearFlashTimer()
      if (flashMs <= 0) afterFlash()
      else flashTimer.current = window.setTimeout(afterFlash, flashMs)
    },
    [
      phase,
      correct,
      times,
      index,
      levelConfig.questions,
      seconds,
      level,
      startLevel,
      finish,
      flashMs,
      challenge,
    ]
  )

  useEffect(() => {
    if (phase !== 'playing' || flash) return
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000
      const left = Math.max(0, seconds - elapsed)
      setSecondsLeft(left)
      if (left <= 0) advance(false, seconds * 1000)
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, seconds, advance, index, flash])

  useEffect(() => () => clearFlashTimer(), [])

  const answer = useCallback(
    (yes: boolean) => {
      if (!challenge || phase !== 'playing' || answering.current) return
      const responseMs = Date.now() - startedAt.current
      const correctAnswer = challenge.answerYes === yes
      advance(correctAnswer, Math.min(responseMs, seconds * 1000))
    },
    [challenge, phase, advance, seconds]
  )

  useYesNoShortcuts({
    enabled: phase === 'intro' || phase === 'playing' || phase === 'result',
    onYes: () => {
      if (phase === 'playing') answer(true)
    },
    onNo: () => {
      if (phase === 'playing') answer(false)
    },
    onStart: phase === 'intro' ? () => startLevel(1) : undefined,
    onExit: phase === 'playing' ? exitSession : undefined,
    onReplay: phase === 'result' ? () => startLevel(1) : undefined,
  })

  if (phase === 'result') {
    return (
      <ScoreBoard
        accuracy={result.accuracy}
        averageResponseMs={result.averageResponseMs}
        score={result.score}
        levelCompleted={result.levelCompleted}
        correctCount={result.correctCount}
        totalQuestions={result.totalQuestions}
        saved={saved}
        guest={!canPersist}
        onPlayAgain={() => startLevel(1)}
        onBack={() => router.push(backHref)}
      />
    )
  }

  if (phase === 'intro') {
    if (!def) return null
    return (
      <GameLaunchScreen
        game={def}
        onPlay={() => startLevel(1)}
        onBack={() => router.push(backHref)}
      />
    )
  }

  return (
    <div className="max-w-xl mx-auto overscroll-none">
      <Card className="border-slate-200">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="border-slate-300 text-slate-700">
              Level {level} · {levelConfig.label}
            </Badge>
            <span className="text-sm font-medium text-slate-600">
              {index + 1} / {levelConfig.questions}
            </span>
          </div>
          <StageRail total={QUIZ_LEVELS.length} current={level} />
          <p className="hidden sm:block text-xs text-slate-500">
            {level <= 2
              ? 'Basic / popular knowledge · extra thinking time'
              : level <= 4
                ? 'Core applied questions · moderate pace'
                : 'Harder items · shorter time'}
          </p>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[var(--brand-navy)] transition-all"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <GameTimer secondsLeft={secondsLeft} totalSeconds={seconds} />
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pb-[9.75rem] md:pb-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-900 px-3 sm:px-4 py-6 sm:py-8 text-center transition-colors shadow-inner min-h-[8.5rem] flex items-center justify-center',
              flash === 'correct' && 'from-emerald-50 to-emerald-50/40 border-emerald-300 text-emerald-950',
              flash === 'incorrect' && 'from-red-50 to-red-50/40 border-red-300 text-red-950'
            )}
          >
            <pre className="relative font-mono text-[15px] sm:text-lg whitespace-pre-wrap leading-relaxed font-semibold tracking-tight max-w-full break-words">
              {challenge?.display}
            </pre>
          </div>
          {coachLine ? (
            <p
              className={cn(
                'text-center text-sm font-medium rounded-lg px-3 py-2 border',
                flash === 'correct'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              )}
            >
              {coachLine}
            </p>
          ) : null}
          <div className="hidden md:block">
            <GameAnswerBar
              prompt={challenge?.prompt ?? 'Answer YES or NO'}
              onYes={() => answer(true)}
              onNo={() => answer(false)}
              disabled={Boolean(flash)}
              flash={flash}
            />
          </div>
        </CardContent>
      </Card>
      <div className="md:hidden">
        <GameAnswerBar
          prompt={challenge?.prompt ?? 'YES or NO?'}
          onYes={() => answer(true)}
          onNo={() => answer(false)}
          disabled={Boolean(flash)}
          flash={flash}
          showShortcuts={false}
        />
      </div>
    </div>
  )
}
