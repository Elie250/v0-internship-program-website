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
  COLOR_WORD_LEVELS,
  colorsForColorWordLevel,
  computeScore,
  playSeconds,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'
import { getGameDef } from '@/lib/brain-training/catalog'
import { StageRail } from '@/components/brain-training/stage-rail'
import { cn } from '@/lib/utils'
import type { DrillPhase } from '@/components/brain-training/types'

export type { DrillPhase }

type Flash = 'correct' | 'incorrect' | null

type Challenge = {
  word: string
  inkHex: string
  inkName: string
  match: boolean
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function buildChallenge(level: number): Challenge {
  // Starter: few popular colors. Hard stages: still popular words (beginner English).
  const palette = colorsForColorWordLevel(level)
  const wordColor = pick(palette)
  const shouldMatch = Math.random() < 0.48
  const others = palette.filter((c) => c.name !== wordColor.name)
  const inkColor = shouldMatch ? wordColor : pick(others.length ? others : palette)
  return {
    word: wordColor.name,
    inkHex: inkColor.hex,
    inkName: inkColor.name,
    match: wordColor.name === inkColor.name,
  }
}

type Props = {
  backHref: string
  canPersist: boolean
  onPersist?: (result: GameResultPayload) => Promise<boolean>
  onPhaseChange?: (phase: DrillPhase) => void
}

export function ColorWordGame({ backHref, canPersist, onPersist, onPhaseChange }: Props) {
  const router = useRouter()
  const touchLayout = useTouchPlayLayout()
  const reducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<DrillPhase>('intro')
  const [level, setLevel] = useState(1)
  const [index, setIndex] = useState(0)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(5)
  const [correct, setCorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [saved, setSaved] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const [warmupLeft, setWarmupLeft] = useState(3)
  const startedAt = useRef(0)
  const sessionStart = useRef(0)
  const answering = useRef(false)
  const sessionClosed = useRef(false)
  const flashTimer = useRef<number | null>(null)

  const setDrillPhase = useCallback(
    (next: DrillPhase) => {
      setPhase(next)
      onPhaseChange?.(next)
    },
    [onPhaseChange]
  )

  useLockBodyScroll(phase === 'playing' || phase === 'warmup')

  const levelConfig =
    COLOR_WORD_LEVELS[Math.max(0, Math.min(level, COLOR_WORD_LEVELS.length) - 1)] ??
    COLOR_WORD_LEVELS[0]!
  const seconds = playSeconds(levelConfig.seconds, touchLayout)
  const progressPct = ((index + (phase === 'playing' ? 1 : 0)) / levelConfig.questions) * 100
  const flashMs = reducedMotion ? 0 : 140

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
      timeTakenMs: Date.now() - (sessionStart.current || Date.now()),
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
      const cfg =
        COLOR_WORD_LEVELS[Math.max(0, Math.min(nextLevel, COLOR_WORD_LEVELS.length) - 1)] ??
        COLOR_WORD_LEVELS[0]!
      const nextSeconds = playSeconds(cfg.seconds, touchLayout)
      sessionClosed.current = false
      setLevel(nextLevel)
      setIndex(0)
      setCorrect(0)
      setTimes([])
      setSaved(false)
      setFlash(null)
      sessionStart.current = Date.now()
      setChallenge(buildChallenge(nextLevel))
      setSecondsLeft(nextSeconds)
      startedAt.current = Date.now()
      answering.current = false
      setDrillPhase('playing')
    },
    [touchLayout, setDrillPhase]
  )

  const startWarmup = useCallback(() => {
    clearFlashTimer()
    setWarmupLeft(3)
    setChallenge(buildChallenge(1))
    setFlash(null)
    answering.current = false
    setDrillPhase('warmup')
  }, [setDrillPhase])

  const exitToIntro = useCallback(() => {
    clearFlashTimer()
    answering.current = false
    setFlash(null)
    setDrillPhase('intro')
  }, [setDrillPhase])

  const finish = useCallback(
    async (finalCorrect: number, finalTimes: number[], finalLevel: number) => {
      if (sessionClosed.current) return
      sessionClosed.current = true
      answering.current = false
      clearFlashTimer()
      setFlash(null)
      setCorrect(finalCorrect)
      setTimes(finalTimes)
      setLevel(finalLevel)
      setDrillPhase('result')

      const cfg =
        COLOR_WORD_LEVELS[Math.max(0, Math.min(finalLevel, COLOR_WORD_LEVELS.length) - 1)] ??
        COLOR_WORD_LEVELS[0]!
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
            gameSlug: 'color-word',
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
    [canPersist, onPersist, touchLayout, setDrillPhase]
  )

  const advance = useCallback(
    (wasCorrect: boolean, responseMs: number) => {
      if (answering.current || sessionClosed.current || phase !== 'playing') return
      answering.current = true
      feedbackPulse(wasCorrect)
      const nextCorrect = correct + (wasCorrect ? 1 : 0)
      const nextTimes = [...times, responseMs]
      const nextIndex = index + 1

      const afterFlash = () => {
        setFlash(null)
        if (nextIndex >= levelConfig.questions) {
          const acc = nextTimes.length > 0 ? nextCorrect / nextTimes.length : 0
          if (acc >= 0.7 && level < COLOR_WORD_LEVELS.length) {
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
        setChallenge(buildChallenge(level))
        setSecondsLeft(seconds)
        startedAt.current = Date.now()
        answering.current = false
      }

      setFlash(wasCorrect ? 'correct' : 'incorrect')
      clearFlashTimer()
      if (flashMs <= 0) {
        afterFlash()
      } else {
        flashTimer.current = window.setTimeout(afterFlash, flashMs)
      }
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
    ]
  )

  const answerWarmup = (yes: boolean) => {
    if (!challenge || phase !== 'warmup' || answering.current) return
    answering.current = true
    const ok = challenge.match === yes
    feedbackPulse(ok)
    setFlash(ok ? 'correct' : 'incorrect')
    const done = () => {
      setFlash(null)
      answering.current = false
      if (warmupLeft <= 1) {
        setDrillPhase('intro')
        return
      }
      setWarmupLeft((n) => n - 1)
      setChallenge(buildChallenge(1))
    }
    if (flashMs <= 0) done()
    else flashTimer.current = window.setTimeout(done, flashMs)
  }

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
      const correctAnswer = challenge.match === yes
      advance(correctAnswer, Math.min(responseMs, seconds * 1000))
    },
    [challenge, phase, advance, seconds]
  )

  useYesNoShortcuts({
    enabled: phase === 'intro' || phase === 'playing' || phase === 'warmup' || phase === 'result',
    onYes: () => {
      if (phase === 'playing') answer(true)
      if (phase === 'warmup') answerWarmup(true)
    },
    onNo: () => {
      if (phase === 'playing') answer(false)
      if (phase === 'warmup') answerWarmup(false)
    },
    onStart: phase === 'intro' ? () => startLevel(1) : undefined,
    onExit: phase === 'playing' || phase === 'warmup' ? exitToIntro : undefined,
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
    const def = getGameDef('color-word')!
    return (
      <GameLaunchScreen
        game={def}
        onPlay={() => startLevel(1)}
        onWarmup={startWarmup}
        onBack={() => router.push(backHref)}
      />
    )
  }

  const prompt =
    phase === 'warmup'
      ? `Warm-up · ${4 - warmupLeft}/3 — is the ink color the same as the word?`
      : 'Is the displayed ink color the same as the word?'

  return (
    <div className="max-w-xl mx-auto overscroll-none">
      <Card className="border-slate-200">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="border-slate-300 text-slate-700">
              {phase === 'warmup'
                ? 'Warm-up · untimed'
                : `Level ${level} · ${levelConfig.label}`}
            </Badge>
            <span className="text-sm font-medium text-slate-600">
              {phase === 'warmup'
                ? `${4 - warmupLeft} / 3`
                : `${index + 1} / ${levelConfig.questions}`}
            </span>
          </div>
          {phase === 'playing' ? <StageRail total={COLOR_WORD_LEVELS.length} current={level} /> : null}
          {phase === 'playing' ? (
            <>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[var(--brand-navy)] transition-all"
                  style={{ width: `${Math.min(100, progressPct)}%` }}
                />
              </div>
              <GameTimer secondsLeft={secondsLeft} totalSeconds={seconds} />
            </>
          ) : (
            <p className="text-xs text-slate-500">Practice only — nothing is scored or saved.</p>
          )}
          <p className="text-xs sm:text-sm text-slate-600 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
            Tip: look at the <span className="font-semibold text-slate-800">ink color</span> of the
            letters — not the meaning of the word. Colors stay simple (red, blue, green…).
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pb-28 md:pb-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-slate-200 px-4 py-12 sm:py-14 text-center transition-colors',
              !reducedMotion && 'duration-150',
              flash === 'correct' && 'bg-emerald-50 border-emerald-200',
              flash === 'incorrect' && 'bg-red-50 border-red-200',
              !flash && 'bg-slate-50'
            )}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-25 blur-2xl"
              style={{ backgroundColor: challenge?.inkHex }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-6 -bottom-10 h-28 w-28 rounded-full opacity-20 blur-xl"
              style={{ backgroundColor: challenge?.inkHex }}
              aria-hidden
            />
            <p
              className="relative text-5xl sm:text-6xl font-black tracking-[0.12em] select-none drop-shadow-sm"
              style={{ color: challenge?.inkHex }}
            >
              {challenge?.word}
            </p>
            {challenge ? (
              <div className="relative mt-5 flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-white shadow"
                  style={{ backgroundColor: challenge.inkHex }}
                  aria-hidden
                />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Ink color
                </span>
              </div>
            ) : null}
          </div>
          {phase === 'playing' ? (
            <p className="text-center text-xs text-slate-500 hidden md:block">
              Score so far: {correct} correct
            </p>
          ) : null}
          <div className="hidden md:block">
            <GameAnswerBar
              prompt={prompt}
              onYes={() => (phase === 'warmup' ? answerWarmup(true) : answer(true))}
              onNo={() => (phase === 'warmup' ? answerWarmup(false) : answer(false))}
              disabled={Boolean(flash)}
              flash={flash}
            />
          </div>
        </CardContent>
      </Card>
      <div className="md:hidden">
        <GameAnswerBar
          prompt={
            phase === 'warmup'
              ? `Warm-up ${4 - warmupLeft}/3 — ink matches word?`
              : 'Is the ink color the same as the word?'
          }
          onYes={() => (phase === 'warmup' ? answerWarmup(true) : answer(true))}
          onNo={() => (phase === 'warmup' ? answerWarmup(false) : answer(false))}
          disabled={Boolean(flash)}
          flash={flash}
          showShortcuts={false}
        />
      </div>
    </div>
  )
}
