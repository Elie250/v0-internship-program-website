'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameTimer } from '@/components/brain-training/timer'
import { ScoreBoard } from '@/components/brain-training/score-board'
import { GameAnswerBar } from '@/components/brain-training/game-answer-bar'
import { GameLaunchScreen } from '@/components/brain-training/game-launch-screen'
import { StageGate } from '@/components/brain-training/stage-gate'
import { SchematicSymbol } from '@/components/brain-training/schematic-symbol'
import {
  feedbackPulse,
  useLockBodyScroll,
  usePrefersReducedMotion,
  useTouchPlayLayout,
  useYesNoShortcuts,
} from '@/components/brain-training/use-brain-play'
import {
  QUIZ_LEVELS,
  STAGE_PASS_ACCURACY,
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
import type { DrillPhase, StageGateState } from '@/components/brain-training/types'
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
  const [stageGate, setStageGate] = useState<StageGateState | null>(null)
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

  useLockBodyScroll(phase === 'playing' || phase === 'stage-gate')

  const levelConfig = QUIZ_LEVELS[Math.max(0, Math.min(level, QUIZ_LEVELS.length) - 1)]!
  const seconds = playSeconds(levelConfig.seconds, touchLayout)
  const progressPct = ((index + (phase === 'playing' ? 1 : 0)) / levelConfig.questions) * 100
  const challenge = deck[index] ?? null
  const flashMs = reducedMotion ? 0 : challenge?.explain ? 900 : 140
  const hardDistract = level >= 4

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
      setStageGate(null)
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
      setStageGate(null)
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
    if (times.length > 0 && (phase === 'playing' || phase === 'stage-gate')) {
      void finish(correct, times, level)
      return
    }
    answering.current = false
    setStageGate(null)
    setDrillPhase('intro')
  }, [times, phase, correct, level, finish, setDrillPhase])

  const openStageGate = useCallback(
    (nextCorrect: number, nextTimes: number[], stageLevel: number) => {
      const acc = nextTimes.length > 0 ? nextCorrect / nextTimes.length : 0
      const passed = acc >= STAGE_PASS_ACCURACY
      setCorrect(nextCorrect)
      setTimes(nextTimes)
      setLevel(stageLevel)
      setStageGate({
        passed,
        level: stageLevel,
        correct: nextCorrect,
        total: nextTimes.length,
        accuracy: Math.round(acc * 100),
      })
      answering.current = false
      setDrillPhase('stage-gate')
    },
    [setDrillPhase]
  )

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
          openStageGate(nextCorrect, nextTimes, level)
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
      openStageGate,
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
    enabled: phase === 'intro' || phase === 'playing' || phase === 'result' || phase === 'stage-gate',
    onYes: () => {
      if (phase === 'playing') answer(true)
      if (phase === 'stage-gate' && stageGate?.passed) {
        if (stageGate.level < QUIZ_LEVELS.length) startLevel(stageGate.level + 1)
        else void finish(stageGate.correct, times, stageGate.level)
      }
    },
    onNo: () => {
      if (phase === 'playing') answer(false)
      if (phase === 'stage-gate' && stageGate && !stageGate.passed) startLevel(stageGate.level)
    },
    onStart: phase === 'intro' ? () => startLevel(1) : undefined,
    onExit: phase === 'playing' || phase === 'stage-gate' ? exitSession : undefined,
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

  const gateLevel =
    QUIZ_LEVELS[Math.max(0, Math.min((stageGate?.level || level) - 1, QUIZ_LEVELS.length - 1))]!

  return (
    <div className="max-w-xl mx-auto overscroll-none">
      {phase === 'stage-gate' && stageGate ? (
        <StageGate
          level={stageGate.level}
          levelLabel={gateLevel.label}
          passed={stageGate.passed}
          correct={stageGate.correct}
          total={stageGate.total}
          accuracy={stageGate.accuracy}
          hasNextStage={stageGate.level < QUIZ_LEVELS.length}
          onContinue={() => startLevel(stageGate.level + 1)}
          onRetry={() => startLevel(stageGate.level)}
          onFinish={() => void finish(stageGate.correct, times, stageGate.level)}
        />
      ) : null}

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
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[var(--brand-navy)] transition-all"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          {phase === 'playing' ? <GameTimer secondsLeft={secondsLeft} totalSeconds={seconds} /> : null}
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pb-[8.5rem] md:pb-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-900 px-3 sm:px-5 py-5 sm:py-6 text-center transition-colors shadow-inner min-h-[11rem] flex flex-col items-center justify-center gap-3',
              flash === 'correct' && 'from-emerald-50 to-emerald-50/40 border-emerald-300 text-emerald-950',
              flash === 'incorrect' && 'from-red-50 to-red-50/40 border-red-300 text-red-950',
              hardDistract && !flash && 'from-slate-50 via-amber-50/40 to-sky-50/50'
            )}
          >
            {hardDistract && !flash ? (
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg,#0f172a 0,#0f172a 1px,transparent 1px,transparent 10px)',
                }}
                aria-hidden
              />
            ) : null}

            {challenge?.symbolId ? (
              <SchematicSymbol
                id={challenge.symbolId}
                caption={challenge.display}
                className="relative w-full"
              />
            ) : (
              <pre className="relative font-mono text-[15px] sm:text-lg whitespace-pre-wrap leading-relaxed font-semibold tracking-tight max-w-full break-words">
                {challenge?.display}
              </pre>
            )}

            {challenge?.symbolMeta ? (
              <p className="relative text-sm font-semibold text-slate-700 bg-white/80 border border-slate-200 rounded-lg px-3 py-1">
                {challenge.symbolMeta}
              </p>
            ) : null}

            <p className="relative mt-1 max-w-md text-base sm:text-lg font-bold text-slate-900 leading-snug px-1">
              {challenge?.prompt ?? 'YES or NO?'}
            </p>
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
              onYes={() => answer(true)}
              onNo={() => answer(false)}
              disabled={Boolean(flash) || phase !== 'playing'}
              flash={flash}
            />
          </div>
        </CardContent>
      </Card>
      <div className="md:hidden">
        <GameAnswerBar
          onYes={() => answer(true)}
          onNo={() => answer(false)}
          disabled={Boolean(flash) || phase !== 'playing'}
          flash={flash}
          showShortcuts={false}
        />
      </div>
    </div>
  )
}
