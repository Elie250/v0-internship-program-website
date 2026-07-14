'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameTimer } from '@/components/brain-training/timer'
import { ScoreBoard } from '@/components/brain-training/score-board'
import {
  BASIC_COLORS,
  COLOR_WORD_LEVELS,
  SIMILAR_COLORS,
  computeScore,
  type GameResultPayload,
} from '@/lib/brain-training/scoring'

type Phase = 'intro' | 'playing' | 'result'

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
  const palette = level >= 3 ? SIMILAR_COLORS : BASIC_COLORS
  const wordColor = pick(palette)
  const shouldMatch = Math.random() < 0.48
  const inkColor = shouldMatch
    ? wordColor
    : pick(palette.filter((c) => c.name !== wordColor.name) as typeof palette)
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
}

export function ColorWordGame({ backHref, canPersist, onPersist }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [level, setLevel] = useState(1)
  const [index, setIndex] = useState(0)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(5)
  const [correct, setCorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [saved, setSaved] = useState(false)
  const startedAt = useRef(0)
  const sessionStart = useRef(0)
  const answering = useRef(false)

  const config = COLOR_WORD_LEVELS[Math.min(level, COLOR_WORD_LEVELS.length) - 1]!
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
      timeTakenMs: Date.now() - (sessionStart.current || Date.now()),
    }
  }, [correct, times, config.seconds, level])

  const startLevel = useCallback((nextLevel: number) => {
    const cfg = COLOR_WORD_LEVELS[Math.min(nextLevel, COLOR_WORD_LEVELS.length) - 1]!
    setLevel(nextLevel)
    setIndex(0)
    setCorrect(0)
    setTimes([])
    setSaved(false)
    sessionStart.current = Date.now()
    const c = buildChallenge(nextLevel)
    setChallenge(c)
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
      const cfg = COLOR_WORD_LEVELS[Math.min(finalLevel, COLOR_WORD_LEVELS.length) - 1]!
      const computed = computeScore({
        correct: finalCorrect,
        total: finalTimes.length,
        responseTimesMs: finalTimes,
        maxPerQuestionMs: cfg.seconds * 1000,
      })
      if (canPersist && onPersist) {
        const ok = await onPersist({
          gameSlug: 'color-word',
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
        // Auto-promote if accuracy >= 70%
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
      setChallenge(buildChallenge(level))
      setSecondsLeft(config.seconds)
      startedAt.current = Date.now()
      answering.current = false
    },
    [phase, correct, times, index, config.questions, config.seconds, level, startLevel, finish]
  )

  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000
      const left = Math.max(0, config.seconds - elapsed)
      setSecondsLeft(left)
      if (left <= 0) {
        advance(false, config.seconds * 1000)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [phase, config.seconds, advance, index])

  const answer = (yes: boolean) => {
    if (!challenge || phase !== 'playing') return
    const responseMs = Date.now() - startedAt.current
    const correctAnswer = challenge.match === yes
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
          <Badge className="w-fit bg-[var(--brand-navy)] text-white">Cognitive drill</Badge>
          <CardTitle className="text-2xl text-slate-900">Color-Word Attention Challenge</CardTitle>
          <p className="text-sm text-slate-600 leading-relaxed">
            Decide whether the <strong>ink color</strong> matches the written color word. Ignore the
            word meaning when it conflicts with the ink — classic Stroop attention training used in
            cognitive readiness programmes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
            <li>Levels auto-increase when you hit ~70% accuracy</li>
            <li>Missed timers count as incorrect</li>
            <li>Score rewards both accuracy and reaction speed</li>
          </ul>
          <Button
            className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            onClick={() => startLevel(1)}
          >
            Begin Level 1 — {COLOR_WORD_LEVELS[0].label}
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
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            Level {level} · {config.label}
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
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p
            className="text-4xl md:text-5xl font-bold tracking-wide select-none"
            style={{ color: challenge?.inkHex }}
          >
            {challenge?.word}
          </p>
        </div>
        <p className="text-center text-base font-semibold text-slate-900">
          Is the displayed ink color the same as the word?
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
        <p className="text-center text-xs text-slate-500">
          Score so far: {correct} correct · avg focus on precision under time pressure
        </p>
      </CardContent>
    </Card>
  )
}
