'use client'

import { GameCard } from '@/components/brain-training/game-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Gauge, Trophy } from 'lucide-react'

type LeaderRow = {
  name: string
  score: number
  accuracy: number
  level: number
  game?: string
}

type Props = {
  basePath: string
  showLeaderboard?: boolean
  leaderboard?: LeaderRow[]
}

export function BrainAcademyHub({ basePath, showLeaderboard, leaderboard = [] }: Props) {
  return (
    <div className="space-y-8">
      <header className="space-y-2 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
          Brain Training Academy
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Cognitive readiness drills</h1>
        <p className="text-slate-600 leading-relaxed">
          Build attention and working memory with timed YES/NO challenges. Designed as warm-ups
          before labs, assessments, and field problem-solving — not casual arcade play.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        <GameCard
          title="Color-Word Attention Challenge"
          description="Stroop-style ink vs word decisions. Train focus and cognitive flexibility under a countdown."
          href={`${basePath}/color-word`}
          skills={['Attention', 'Flexibility', 'Speed']}
          maxLevel={4}
          estimatedMinutes={4}
        />
        <GameCard
          title="Same / Different Sequence Test"
          description="Compare digit, letter, and mixed sequences. Spot tiny differences before time runs out."
          href={`${basePath}/sequence-match`}
          skills={['Memory', 'Detail', 'Speed']}
          maxLevel={4}
          estimatedMinutes={4}
        />
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[var(--brand-navy)]" />
            How sessions are scored
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900 mb-1">Accuracy (primary)</p>
            <p>Up to ~800 XP from correct YES/NO decisions. Missed timers count as incorrect.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-1">Speed bonus</p>
            <p>Up to 200 XP for faster average responses relative to the level clock.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-1">Progression</p>
            <p>~70% accuracy auto-promotes to the next level within the same session.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            icon: Gauge,
            title: 'Brain assessment',
            body: 'Student profiles roll accuracy, memory, and speed into an overall readiness score.',
          },
          {
            icon: Trophy,
            title: 'Leaderboards',
            body: showLeaderboard ? 'Top recent scores are listed below.' : 'Sign in to view cohort rankings.',
          },
          {
            icon: ClipboardList,
            title: 'Rewards',
            body: 'Badges unlock for 90%+ accuracy and Expert (Level 4) clears.',
          },
        ].map((item) => (
          <Card key={item.title} className="border-slate-200 bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-900 flex items-center gap-2">
                <item.icon className="h-3.5 w-3.5 text-[var(--brand-navy)]" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 leading-relaxed">{item.body}</CardContent>
          </Card>
        ))}
      </div>

      {showLeaderboard ? (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Recent top scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-600">No saved sessions yet. Be the first on the board.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {leaderboard.map((row, i) => (
                  <li
                    key={`${row.name}-${row.game ?? 'drill'}-${i}`}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-slate-900 min-w-0">
                      {i + 1}. {row.name}
                      {row.game ? (
                        <span className="ml-2 text-xs font-normal text-slate-500">{row.game}</span>
                      ) : null}
                    </span>
                    <span className="text-slate-600 shrink-0">
                      {row.score} XP · {row.accuracy}% · L{row.level}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
