'use client'

import { GameCard } from '@/components/brain-training/game-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

type LeaderRow = {
  name: string
  score: number
  accuracy: number
  level: number
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

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { title: 'Brain assessment', body: 'Profile scores update as you train (students).' },
          { title: 'Leaderboards', body: showLeaderboard ? 'Top scores below.' : 'Available after login.' },
          { title: 'Rewards', body: 'Badges unlock for high accuracy and expert clears.' },
        ].map((item) => (
          <Card key={item.title} className="border-slate-200 bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-900">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600">{item.body}</CardContent>
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
                  <li key={`${row.name}-${i}`} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-900">
                      {i + 1}. {row.name}
                    </span>
                    <span className="text-slate-600">
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
