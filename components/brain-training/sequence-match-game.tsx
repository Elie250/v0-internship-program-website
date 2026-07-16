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
  SEQUENCE_LEVELS,
  STAGE_PASS_ACCURACY,
  bridgeLineCount,
  computeScore,
  playSeconds,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'
import { getGameDef } from '@/lib/brain-training/catalog'
import { StageRail } from '@/components/brain-training/stage-rail'
import { cn } from '@/lib/utils'
import type { DrillPhase, StageGateState } from '@/components/brain-training/types'
import { trackBrainEngagement } from '@/lib/brain-training/client-engagement'

type Flash = 'correct' | 'incorrect' | null
type CharMode = 'numbers' | 'letters' | 'mixed'

type Challenge = {
  mode: 'pair' | 'bridge'
  left: string
  right: string
  /** Multi-line mode: ask if first line === last line */
  lines: string[]
  identical: boolean
}

function randomChar(mode: CharMode, hard = false): string {
  if (mode === 'numbers') {
    if (hard) {
      const pool = '018356'
      return pool[Math.floor(Math.random() * pool.length)]!
    }
    return String(Math.floor(Math.random() * 10))
  }
  if (mode === 'letters') {
    if (hard) {
      const pool = 'OQDBG8'
      return pool[Math.floor(Math.random() * pool.length)]!
    }
    return String.fromCharCode(65 + Math.floor(Math.random() * 26))
  }
  const pool = hard ? '0O1I8B5S' : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return pool[Math.floor(Math.random() * pool.length)]!
}

function similarSwap(ch: string): string {
  const map: Record<string, string[]> = {
    '0': ['O', '8', 'Q'],
    O: ['0', 'Q', 'D'],
    '1': ['I', '7', 'L'],
    I: ['1', 'L', 'T'],
    '8': ['B', '0', '3'],
    B: ['8', 'R', 'D'],
    '5': ['S', '6'],
    S: ['5', '8'],
  }
  const opts = map[ch]
  if (!opts?.length) return ch
  return opts[Math.floor(Math.random() * opts.length)]!
}

function buildSequence(length: number, mode: CharMode, hard = false): string {
  return Array.from({ length }, () => randomChar(mode, hard)).join('')
}

function mutateSequence(left: string, mode: CharMode, hard: boolean): string {
  const chars = left.split('')
  const idx = Math.floor(Math.random() * chars.length)
  if (hard && Math.random() < 0.65) {
    const swap = similarSwap(chars[idx]!)
    chars[idx] = swap === chars[idx] ? randomChar(mode, true) : swap
  } else {
    let replacement = randomChar(mode, hard)
    while (replacement === chars[idx]) replacement = randomChar(mode, hard)
    chars[idx] = replacement
  }
  if (left.length >= 10 && Math.random() < (hard ? 0.55 : 0.35)) {
    const idx2 = (idx + 3) % chars.length
    if (hard) {
      const swap = similarSwap(chars[idx2]!)
      chars[idx2] = swap === chars[idx2] ? randomChar(mode, true) : swap
    } else {
      let r2 = randomChar(mode)
      while (r2 === chars[idx2]) r2 = randomChar(mode)
      chars[idx2] = r2
    }
  }
  return chars.join('')
}

function buildChallenge(length: number, mode: CharMode, level: number): Challenge {
  const hard = level >= 4
  const lineCount = bridgeLineCount(level)

  if (lineCount <= 1) {
    const left = buildSequence(length, mode, hard)
    const identical = Math.random() < 0.5
    if (identical) return { mode: 'pair', left, right: left, lines: [left], identical: true }
    const right = mutateSequence(left, mode, hard)
    return { mode: 'pair', left, right, lines: [left, right], identical: false }
  }

  // Multi-line: is the first line identical to the last?
  const identical = Math.random() < 0.5
  const first = buildSequence(length, mode, hard)
  const last = identical ? first : mutateSequence(first, mode, hard)
  const lines: string[] = [first]
  for (let i = 1; i < lineCount - 1; i++) {
    lines.push(buildSequence(length, mode, hard))
  }
  lines.push(last)
  return {
    mode: 'bridge',
    left: first,
    right: last,
    lines,
    identical,
  }
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
        trackBrainEngagement('open', 'sequence-match', { isGuest: !canPersist })
      } else if (next === 'result') {
        trackBrainEngagement('complete', 'sequence-match', { isGuest: !canPersist })
      }
    },
    [onPhaseChange, canPersist]
  )

  useLockBodyScroll(phase === 'playing' || phase === 'warmup' || phase === 'stage-gate')

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
      setStageGate(null)
      sessionStart.current = Date.now()
      const m = nextMode(0)
      setMode(m)
      setChallenge(buildChallenge(cfg.length, m, nextLevel))
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
    setChallenge(buildChallenge(5, 'numbers', 1))
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
        const m = nextMode(nextIndex)
        setMode(m)
        setChallenge(buildChallenge(levelConfig.length, m, level))
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
      openStageGate,
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
      setChallenge(buildChallenge(5, 'numbers', 1))
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
        if (stageGate.level < SEQUENCE_LEVELS.length) startLevel(stageGate.level + 1)
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

  const isBridge = challenge?.mode === 'bridge'
  const questionLine =
    phase === 'warmup'
      ? `Warm-up ${4 - warmupLeft}/3 — identical?`
      : isBridge
        ? 'Is the FIRST line identical to the LAST line?'
        : 'Are A and B identical?'
  const hardDistract = level >= 4 && phase === 'playing'
  const gateLevel =
    SEQUENCE_LEVELS[Math.max(0, Math.min((stageGate?.level || level) - 1, SEQUENCE_LEVELS.length - 1))]!

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
          hasNextStage={stageGate.level < SEQUENCE_LEVELS.length}
          onContinue={() => startLevel(stageGate.level + 1)}
          onRetry={() => startLevel(stageGate.level)}
          onFinish={() => void finish(stageGate.correct, times, stageGate.level)}
        />
      ) : null}

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
          {phase === 'playing' || phase === 'stage-gate' ? (
            <StageRail total={SEQUENCE_LEVELS.length} current={level} />
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
              'rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-3 py-4 sm:px-4 sm:py-5 space-y-3 transition-colors',
              !reducedMotion && 'duration-150',
              flash === 'correct' && 'from-emerald-50 to-emerald-50/40 border-emerald-300',
              flash === 'incorrect' && 'from-red-50 to-red-50/40 border-red-300',
              hardDistract && !flash && 'from-amber-50/50 via-white to-sky-50/40'
            )}
          >
            {isBridge && challenge ? (
              <div className="space-y-2">
                {challenge.lines.map((value, i) => {
                  const isFirst = i === 0
                  const isLast = i === challenge.lines.length - 1
                  return (
                    <SequenceBox
                      key={`${value}-${i}`}
                      label={isFirst ? '1st' : isLast ? 'Last' : `L${i + 1}`}
                      value={value}
                      hard={hardDistract || isFirst || isLast}
                      emphasize={isFirst || isLast}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                <SequenceBox label="A" value={challenge?.left ?? ''} hard={hardDistract} />
                <SequenceBox label="B" value={challenge?.right ?? ''} hard={hardDistract} />
              </div>
            )}
            <p className="text-center text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {questionLine}
            </p>
          </div>
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

function SequenceBox({
  label,
  value,
  hard,
  emphasize,
}: {
  label: string
  value: string
  hard?: boolean
  emphasize?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-3 sm:py-2.5 min-w-0',
        emphasize
          ? 'border-[var(--brand-navy)]/30 bg-white shadow-sm'
          : hard
            ? 'border-slate-300 bg-white/80'
            : 'border-slate-200 bg-slate-50'
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label === 'A' || label === 'B' ? `Sequence ${label}` : label}
      </p>
      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p
          className={cn(
            'font-mono tracking-[0.14em] sm:tracking-[0.12em] text-slate-900 whitespace-nowrap text-center font-bold inline-block min-w-full',
            emphasize || hard ? 'text-lg sm:text-xl' : 'text-base md:text-lg'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
