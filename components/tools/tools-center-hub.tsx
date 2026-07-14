'use client'

import Link from 'next/link'
import { Brain, Calculator, ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  calculatorsHref: string
  brainHref: string
  className?: string
  title?: string
  subtitle?: string
}

export function ToolsCenterHub({
  calculatorsHref,
  brainHref,
  className,
  title = 'Tools Center',
  subtitle = 'Professional engineering calculators and cognitive readiness drills for training sessions.',
}: Props) {
  return (
    <div className={cn('space-y-8', className)}>
      <header className="space-y-2 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
          Energy &amp; Logics · Engineering Hub
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600 leading-relaxed">{subtitle}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="border-slate-200 bg-white hover:border-[var(--brand-navy)]/40 transition-colors">
          <CardHeader>
            <div className="rounded-lg bg-slate-100 w-fit p-3 text-[var(--brand-navy)] mb-2">
              <Calculator className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl text-slate-900">Engineering Calculators</CardTitle>
            <CardDescription className="text-slate-600 leading-relaxed">
              Electrical, installation, embedded, and solar calculators for field and classroom work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>· Electrical &amp; power formulas</li>
              <li>· Cable, conduit &amp; motor tools</li>
              <li>· Electronics &amp; PLC timing aids</li>
              <li>· Solar sizing utilities</li>
            </ul>
            <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              <Link href={calculatorsHref}>
                Open calculators
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-[var(--brand-navy)]/40 transition-colors">
          <CardHeader>
            <div className="rounded-lg bg-[var(--brand-navy)]/10 w-fit p-3 text-[var(--brand-navy)] mb-2">
              <Brain className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
              Brain Training Academy
              <Sparkles className="h-4 w-4 text-amber-500" />
            </CardTitle>
            <CardDescription className="text-slate-600 leading-relaxed">
              Short cognitive drills that prepare attention, memory, and processing speed before
              technical study.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['Attention', 'Memory', 'Logic', 'Processing speed'].map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
            <Button asChild className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              <Link href={brainHref}>
                Enter Academy
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
