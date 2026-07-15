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
  SEQUENCE_LEVELS,
  computeScore,
  playSeconds,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'
import { getGameDef } from '@/lib/brain-training/catalog'
import { StageRail } from '@/components/brain-training/stage-rail'
import { cn } from '@/lib/utils'
import type { DrillPhase } from '@/components/brain-training/types'

type Flash = 'correct' | 'incorrect' | null
type CharMode = 'numbers' | 'letters' | 'mixed'

type Challenge = {
  left: string
  right: string
  identical: boolean
}

function randomChar(mode: CharMode): string {
  if (mode === 'numbers') return String(Math.floor(Math.random() * 10))
  if (mode === 'letters') return String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return pool[Math.floor(Math.random() * pool.length)]!
}

function buildSequence(length: number, mode: CharMode): string {
  return Array.from({ length }, () => randomChar(mode)).join('')
}

function buildChallenge(length: number, mode: CharMode): Challenge {
  const left = buildSequence(length, mode)
  const identical = Math.random() < 0.5
  if (identical) return { left, right: left, identical: true }

  const chars = left.split('')
  const idx = Math.floor(Math.random() * chars.length)
  let replacement = randomChar(mode)
  while (replacement === chars[idx]) replacement = randomChar(mode)
  chars[idx] = replacement
  if (length >= 12 && Math.random() < 0.35) {
    const idx2 = (idx + 3) % chars.length
    let r2 = randomChar(mode)
    while (r2 === chars[idx2]) r2 = randomChar(mode)
    chars[idx2] = r2
  }
  return { left, right: chars.join(''), identical: false }
}

type Props = {
  backHref: string
  canPersist: boolean
  onPersist?: (result: GameResultPayload) => Promise<boolean>
  onPhaseChange?: (phase: DrillPhase) => void
}

export function SequenceMatchGame({ backHref, canPersist, onPersist, onPhaseChange }: Props) {
  const router = useRouter()
  const touchLayout = useTouchPlayLayout()
  const reducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<DrillPhase>('intro')
  const [level, setLevel] = useState(1)
  const [index, setIndex] = useState(0)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [mode, setMode] = useState<CharMode>('numbers')
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
    SEQUENCE_LEVELS[Math.max(0, Math.min(level, SEQUENCE_LEVELS.length) - 1)] ??
    SEQUENCE_LEVELS[0]!
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
    }
  }, [correct, times, seconds, level])

  const nextMode = (qIndex: number): CharMode => {
    const cycle: CharMode[] = ['numbers', 'letters', 'mixed']
    return cycle[qIndex % 3]!
  }

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
        SEQUENCE_LEVELS[Math.max(0, Math.min(nextLevel, SEQUENCE_LEVELS.length) - 1)] ??
        SEQUENCE_LEVELS[0]!
      const nextSeconds = playSeconds(cfg.seconds, touchLayout)
      sessionClosed.current = false
      setLevel(nextLevel)
      setIndex(0)
      setCorrect(0)
      setTimes([])
      setSaved(false)
      setFlash(null)
      sessionStart.current = Date.now()
      const m = nextMode(0)
      setMode(m)
      setChallenge(buildChallenge(cfg.length, m))
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
    setMode('numbers')
    setChallenge(buildChallenge(5, 'numbers'))
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
        SEQUENCE_LEVELS[Math.max(0, Math.min(finalLevel, SEQUENCE_LEVELS.length) - 1)] ??
        SEQUENCE_LEVELS[0]!
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
            gameSlug: 'sequence-match',
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
          if (acc >= 0.7 && level < SEQUENCE_LEVELS.length) {
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
        const m = nextMode(nextIndex)
        setMode(m)
        setChallenge(buildChallenge(levelConfig.length, m))
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
      levelConfig.length,
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
    const ok = challenge.identical === yes
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
      setChallenge(buildChallenge(5, 'numbers'))
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
      const correctAnswer = challenge.identical === yes
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
    const def = getGameDef('sequence-match')!
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
      ? `Warm-up · ${4 - warmupLeft}/3 — are these sequences identical?`
      : 'Are these sequences identical?'

  return (
    <div className="max-w-xl mx-auto overscroll-none">
      <Card className="border-slate-200">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="outline" className="border-slate-300 text-slate-700">
              {phase === 'warmup'
                ? 'Warm-up · untimed'
                : `Level ${level} · ${levelConfig.length} chars · ${mode}`}
            </Badge>
            <span className="text-sm font-medium text-slate-600">
              {phase === 'warmup'
                ? `${4 - warmupLeft} / 3`
                : `${index + 1} / ${levelConfig.questions}`}
            </span>
          </div>
          {phase === 'playing' ? <StageRail total={SEQUENCE_LEVELS.length} current={level} /> : null}
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
        </CardHeader>
        <CardContent className="space-y-4 pb-28 md:pb-4">
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl transition-colors',
              !reducedMotion && 'duration-150',
              flash === 'correct' && 'bg-emerald-50/60',
              flash === 'incorrect' && 'bg-red-50/60'
            )}
          >
            <SequenceBox label="Sequence A" value={challenge?.left ?? ''} />
            <SequenceBox label="Sequence B" value={challenge?.right ?? ''} />
          </div>
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
              ? `Warm-up ${4 - warmupLeft}/3 — identical?`
              : 'Are these sequences identical?'
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

function SequenceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
      </p>
      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p className="font-mono text-base sm:text-lg md:text-xl tracking-[0.1em] sm:tracking-[0.12em] text-slate-900 whitespace-nowrap text-center font-semibold inline-block min-w-full">
          {value}
        </p>
      </div>
    </div>
  )
}
