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
import {
  feedbackPulse,
  useLockBodyScroll,
  usePrefersReducedMotion,
  useTouchPlayLayout,
  useYesNoShortcuts,
} from '@/components/brain-training/use-brain-play'
import {
  COLOR_WORD_LEVELS,
  STAGE_PASS_ACCURACY,
  bridgeLineCount,
  colorsForColorWordLevel,
  computeScore,
  playSeconds,
  type ColorEntry,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'
import { getGameDef } from '@/lib/brain-training/catalog'
import { StageRail } from '@/components/brain-training/stage-rail'
import { cn } from '@/lib/utils'
import type { DrillPhase, StageGateState } from '@/components/brain-training/types'
import { trackBrainEngagement } from '@/lib/brain-training/client-engagement'

export type { DrillPhase }

type Flash = 'correct' | 'incorrect' | null

type ColorLine = {
  word: string
  ink: ColorEntry
}

type Challenge = {
  /** classic = ink matches word; bridge = first ink vs last word meaning */
  mode: 'classic' | 'bridge'
  lines: ColorLine[]
  match: boolean
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function buildChallenge(level: number): Challenge {
  const palette = colorsForColorWordLevel(level)
  const lineCount = bridgeLineCount(level)

  if (lineCount <= 1) {
    const wordColor = pick(palette)
    const shouldMatch = Math.random() < 0.48
    const others = palette.filter((c) => c.name !== wordColor.name)
    const ink = shouldMatch ? wordColor : pick(others.length ? others : palette)
    return {
      mode: 'classic',
      lines: [{ word: wordColor.name, ink }],
      match: wordColor.name === ink.name,
    }
  }

  // Multi-line: does FIRST word's ink match LAST word's meaning?
  const shouldMatch = Math.random() < 0.48
  const lastMeaning = pick(palette)
  const others = palette.filter((c) => c.name !== lastMeaning.name)
  const firstInk = shouldMatch ? lastMeaning : pick(others.length ? others : palette)
  const firstWord = pick(palette)

  const lines: ColorLine[] = [{ word: firstWord.name, ink: firstInk }]
  for (let i = 1; i < lineCount - 1; i++) {
    lines.push({ word: pick(palette).name, ink: pick(palette) })
  }
  lines.push({ word: lastMeaning.name, ink: pick(palette) })

  return {
    mode: 'bridge',
    lines,
    match: firstInk.name === lastMeaning.name,
  }
}

function InkWord({
  word,
  ink,
  size = 'lg',
}: {
  word: string
  ink: ColorEntry
  size?: 'lg' | 'md' | 'sm'
}) {
  const sizeClass =
    size === 'lg'
      ? 'text-[2.5rem] sm:text-5xl tracking-[0.1em]'
      : size === 'md'
        ? 'text-2xl sm:text-3xl tracking-[0.08em]'
        : 'text-lg sm:text-xl tracking-[0.06em]'
  return (
    <span
      className={cn(
        'inline-block font-black select-none px-2 py-0.5 rounded-md',
        ink.onDark && 'bg-slate-800 ring-1 ring-slate-600',
        sizeClass
      )}
      style={{
        color: ink.hex,
        textShadow: ink.onDark
          ? '0 1px 0 rgba(0,0,0,0.35)'
          : '0 1px 0 rgba(255,255,255,0.55), 0 0 1px rgba(15,23,42,0.35)',
      }}
    >
      {word}
    </span>
  )
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
        trackBrainEngagement('open', 'color-word', { isGuest: !canPersist })
      } else if (next === 'result') {
        trackBrainEngagement('complete', 'color-word', { isGuest: !canPersist })
      }
    },
    [onPhaseChange, canPersist]
  )

  useLockBodyScroll(phase === 'playing' || phase === 'warmup' || phase === 'stage-gate')

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
      setStageGate(null)
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
      setStageGate(null)
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

  const openStageGate = useCallback(
    (nextCorrect: number, nextTimes: number[], stageLevel: number) => {
      const acc = nextTimes.length > 0 ? nextCorrect / nextTimes.length : 0
      setCorrect(nextCorrect)
      setTimes(nextTimes)
      setLevel(stageLevel)
      setStageGate({
        passed: acc >= STAGE_PASS_ACCURACY,
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

      const afterFlash = () => {
        setFlash(null)
        if (nextIndex >= levelConfig.questions) {
          openStageGate(nextCorrect, nextTimes, level)
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
      openStageGate,
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
    enabled:
      phase === 'intro' ||
      phase === 'playing' ||
      phase === 'warmup' ||
      phase === 'result' ||
      phase === 'stage-gate',
    onYes: () => {
      if (phase === 'playing') answer(true)
      if (phase === 'warmup') answerWarmup(true)
      if (phase === 'stage-gate' && stageGate?.passed) {
        if (stageGate.level < COLOR_WORD_LEVELS.length) startLevel(stageGate.level + 1)
        else void finish(stageGate.correct, times, stageGate.level)
      }
    },
    onNo: () => {
      if (phase === 'playing') answer(false)
      if (phase === 'warmup') answerWarmup(false)
      if (phase === 'stage-gate' && stageGate && !stageGate.passed) startLevel(stageGate.level)
    },
    onStart: phase === 'intro' ? () => startLevel(1) : undefined,
    onExit: phase === 'playing' || phase === 'warmup' || phase === 'stage-gate' ? exitToIntro : undefined,
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

  const isBridge = challenge?.mode === 'bridge'
  const questionLine =
    phase === 'warmup'
      ? `Warm-up ${4 - warmupLeft}/3 — same ink as the word?`
      : isBridge
        ? 'Does the FIRST word’s ink match the LAST word’s meaning?'
        : 'Same ink color as the word?'
  const firstLine = challenge?.lines[0]
  const gateLevel =
    COLOR_WORD_LEVELS[Math.max(0, Math.min((stageGate?.level || level) - 1, COLOR_WORD_LEVELS.length - 1))]!

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
          hasNextStage={stageGate.level < COLOR_WORD_LEVELS.length}
          onContinue={() => startLevel(stageGate.level + 1)}
          onRetry={() => startLevel(stageGate.level)}
          onFinish={() => void finish(stageGate.correct, times, stageGate.level)}
        />
      ) : null}

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
          {phase === 'playing' || phase === 'stage-gate' ? (
            <StageRail total={COLOR_WORD_LEVELS.length} current={level} />
          ) : null}
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
          ) : phase === 'warmup' ? (
            <p className="text-xs text-slate-500">Practice only — nothing is scored or saved.</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pb-[8.5rem] md:pb-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-slate-200 px-3 sm:px-4 py-6 sm:py-8 text-center transition-colors',
              !reducedMotion && 'duration-150',
              flash === 'correct' && 'bg-emerald-50 border-emerald-200',
              flash === 'incorrect' && 'bg-red-50 border-red-200',
              !flash && 'bg-slate-100'
            )}
          >
            {firstLine ? (
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-20 blur-2xl"
                style={{ backgroundColor: firstLine.ink.hex }}
                aria-hidden
              />
            ) : null}

            {challenge?.mode === 'classic' && firstLine ? (
              <div className="relative space-y-4">
                <InkWord word={firstLine.word} ink={firstLine.ink} size="lg" />
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full border-2 border-white shadow ring-1 ring-slate-300"
                    style={{ backgroundColor: firstLine.ink.hex }}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Look at ink
                  </span>
                </div>
              </div>
            ) : null}

            {challenge?.mode === 'bridge' ? (
              <div className="relative space-y-2.5 sm:space-y-3">
                {challenge.lines.map((line, i) => {
                  const isFirst = i === 0
                  const isLast = i === challenge.lines.length - 1
                  return (
                    <div
                      key={`${line.word}-${i}`}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl px-2 py-1.5',
                        (isFirst || isLast) && 'bg-white/80 border border-slate-200 shadow-sm'
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-10 text-right shrink-0">
                        {isFirst ? '1st' : isLast ? 'Last' : `L${i + 1}`}
                      </span>
                      <InkWord
                        word={line.word}
                        ink={line.ink}
                        size={isFirst || isLast ? 'md' : 'sm'}
                      />
                    </div>
                  )
                })}
              </div>
            ) : null}

            <p className="relative mt-5 text-base sm:text-lg font-bold text-slate-900 leading-snug px-1">
              {questionLine}
            </p>
          </div>
          {phase === 'playing' ? (
            <p className="text-center text-xs text-slate-500 hidden md:block">
              Score so far: {correct} correct
            </p>
          ) : null}
          <div className="hidden md:block">
            <GameAnswerBar
              onYes={() => (phase === 'warmup' ? answerWarmup(true) : answer(true))}
              onNo={() => (phase === 'warmup' ? answerWarmup(false) : answer(false))}
              disabled={Boolean(flash) || phase === 'stage-gate'}
              flash={flash}
            />
          </div>
        </CardContent>
      </Card>
      <div className="md:hidden">
        <GameAnswerBar
          onYes={() => (phase === 'warmup' ? answerWarmup(true) : answer(true))}
          onNo={() => (phase === 'warmup' ? answerWarmup(false) : answer(false))}
          disabled={Boolean(flash) || phase === 'stage-gate'}
          flash={flash}
          showShortcuts={false}
        />
      </div>
    </div>
  )
}
