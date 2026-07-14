'use client'

import Link from 'next/link'
import { Brain, Clock3, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Props = {
  title: string
  description: string
  href: string
  skills: string[]
  maxLevel: number
  estimatedMinutes?: number
}

export function GameCard({
  title,
  description,
  href,
  skills,
  maxLevel,
  estimatedMinutes = 3,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm hover:border-[var(--brand-navy)]/40 transition-colors h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-lg bg-[var(--brand-navy)]/10 p-2.5 text-[var(--brand-navy)]">
            <Brain className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-slate-600 border-slate-300">
            Levels 1–{maxLevel}
          </Badge>
        </div>
        <CardTitle className="text-lg text-slate-900 mt-3">{title}</CardTitle>
        <CardDescription className="text-slate-600 leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              <Target className="h-3 w-3 text-[var(--brand-navy)]" />
              {skill}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" /> ~{estimatedMinutes} min
          </p>
          <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
            <Link href={href}>Start drill</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
