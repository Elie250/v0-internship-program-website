'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameTimer } from '@/components/brain-training/timer'
import { ScoreBoard } from '@/components/brain-training/score-board'
import {
  SEQUENCE_LEVELS,
  computeScore,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'

type Phase = 'intro' | 'playing' | 'result'
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
  // Occasionally mutate a second position on longer sequences
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
}

export function SequenceMatchGame({ backHref, canPersist, onPersist }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [level, setLevel] = useState(1)
  const [index, setIndex] = useState(0)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [mode, setMode] = useState<CharMode>('numbers')
  const [secondsLeft, setSecondsLeft] = useState(5)
  const [correct, setCorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [saved, setSaved] = useState(false)
  const startedAt = useRef(0)
  const sessionStart = useRef(0)
  const answering = useRef(false)

  const config = SEQUENCE_LEVELS[Math.min(level, SEQUENCE_LEVELS.length) - 1]!
  const progressPct = ((index + (phase === 'playing' ? 1 : 0)) / config.questions) * 100

  const result = useMemo(() => {
    const computed = computeScore({
      correct,
      total: times.length,
      responseTimesMs: times,
      maxPerQuestionMs: config.seconds * 1000,
    })
    return {
      ...computed,
      levelCompleted: level,
      correctCount: correct,
      totalQuestions: times.length,
    }
  }, [correct, times, config.seconds, level])

  const nextMode = (qIndex: number): CharMode => {
    const cycle: CharMode[] = ['numbers', 'letters', 'mixed']
    return cycle[qIndex % 3]!
  }

  const startLevel = useCallback((nextLevel: number) => {
    const cfg = SEQUENCE_LEVELS[Math.min(nextLevel, SEQUENCE_LEVELS.length) - 1]!
    setLevel(nextLevel)
    setIndex(0)
    setCorrect(0)
    setTimes([])
    setSaved(false)
    sessionStart.current = Date.now()
    const m = nextMode(0)
    setMode(m)
    setChallenge(buildChallenge(cfg.length, m))
    setSecondsLeft(cfg.seconds)
    startedAt.current = Date.now()
    answering.current = false
    setPhase('playing')
  }, [])

  const finish = useCallback(
    async (finalCorrect: number, finalTimes: number[], finalLevel: number) => {
      setCorrect(finalCorrect)
      setTimes(finalTimes)
      setLevel(finalLevel)
      setPhase('result')
      const cfg = SEQUENCE_LEVELS[Math.min(finalLevel, SEQUENCE_LEVELS.length) - 1]!
      const computed = computeScore({
        correct: finalCorrect,
        total: finalTimes.length,
        responseTimesMs: finalTimes,
        maxPerQuestionMs: cfg.seconds * 1000,
      })
      if (canPersist && onPersist) {
        const ok = await onPersist({
          gameSlug: 'sequence-match',
          score: computed.score,
          accuracy: computed.accuracy,
          averageResponseMs: computed.averageResponseMs,
          timeTakenMs: Date.now() - sessionStart.current,
          levelCompleted: finalLevel,
          correctCount: finalCorrect,
          totalQuestions: finalTimes.length,
        })
        setSaved(ok)
      }
    },
    [canPersist, onPersist]
  )

  const advance = useCallback(
    (wasCorrect: boolean, responseMs: number) => {
      if (answering.current || phase !== 'playing') return
      answering.current = true
      const nextCorrect = correct + (wasCorrect ? 1 : 0)
      const nextTimes = [...times, responseMs]
      const nextIndex = index + 1

      if (nextIndex >= config.questions) {
        const acc = nextCorrect / nextTimes.length
        if (acc >= 0.7 && level < 4) {
          setCorrect(nextCorrect)
          setTimes(nextTimes)
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
      setChallenge(buildChallenge(config.length, m))
      setSecondsLeft(config.seconds)
      startedAt.current = Date.now()
      answering.current = false
    },
    [phase, correct, times, index, config.questions, config.length, config.seconds, level, startLevel, finish]
  )

  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000
      const left = Math.max(0, config.seconds - elapsed)
      setSecondsLeft(left)
      if (left <= 0) advance(false, config.seconds * 1000)
    }, 50)
    return () => window.clearInterval(id)
  }, [phase, config.seconds, advance, index])

  const answer = (yes: boolean) => {
    if (!challenge || phase !== 'playing') return
    const responseMs = Date.now() - startedAt.current
    const correctAnswer = challenge.identical === yes
    advance(correctAnswer, Math.min(responseMs, config.seconds * 1000))
  }

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
    return (
      <Card className="max-w-xl mx-auto border-slate-200">
        <CardHeader>
          <Badge className="w-fit bg-[var(--brand-navy)] text-white">Memory drill</Badge>
          <CardTitle className="text-2xl text-slate-900">Same / Different Sequence Test</CardTitle>
          <p className="text-sm text-slate-600 leading-relaxed">
            Compare two sequences of numbers, letters, or mixed characters. Spot tiny differences
            under time pressure — the same skill used when reading schematic references and wire
            labels on site.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
            <li>Sequences grow longer each level</li>
            <li>Modes rotate: numbers → letters → mixed</li>
            <li>~70% accuracy unlocks the next level automatically</li>
          </ul>
          <Button
            className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            onClick={() => startLevel(1)}
          >
            Begin Level 1 — {SEQUENCE_LEVELS[0].label}
          </Button>
          <Button variant="outline" className="w-full border-slate-300" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-xl mx-auto border-slate-200">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            Level {level} · {config.length} chars · {mode}
          </Badge>
          <span className="text-sm font-medium text-slate-600">
            {index + 1} / {config.questions}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-[var(--brand-navy)] transition-all"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <GameTimer secondsLeft={secondsLeft} totalSeconds={config.seconds} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <SequenceBox label="Sequence A" value={challenge?.left ?? ''} />
          <SequenceBox label="Sequence B" value={challenge?.right ?? ''} />
        </div>
        <p className="text-center text-base font-semibold text-slate-900">
          Are these sequences identical?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-14 text-base bg-emerald-700 hover:bg-emerald-800 text-white"
            onClick={() => answer(true)}
          >
            YES
          </Button>
          <Button
            size="lg"
            className="h-14 text-base bg-slate-800 hover:bg-slate-900 text-white"
            onClick={() => answer(false)}
          >
            NO
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SequenceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
      </p>
      <p className="font-mono text-lg md:text-xl tracking-[0.12em] text-slate-900 break-all text-center font-semibold">
        {value}
      </p>
    </div>
  )
}
