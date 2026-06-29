import Link from 'next/link'
import { ArrowRight, Cpu, Factory, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TRAINING_PROGRAMS } from '@/lib/company/constants'

const icons = [Cpu, Factory, Zap] as const

export function TrainingProgramsSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="section-eyebrow mb-2">Training programmes</p>
          <h2 className="section-title mb-3">Built for real engineering work</h2>
          <p className="text-muted-foreground">
            In-person training in Rwanda with online options for regional learners. All programmes
            are led by practitioners—not generic online templates.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TRAINING_PROGRAMS.map((program, index) => {
            const Icon = icons[index] ?? Cpu
            return (
              <Card key={program.id} className="flex flex-col h-full border-[#1e3a5f]/10">
                <CardHeader>
                  <div className="w-11 h-11 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-[#1e3a5f]" />
                  </div>
                  <CardTitle className="text-xl text-[#1e3a5f]">{program.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <p className="text-sm text-muted-foreground">{program.summary}</p>
                  <ul className="text-sm space-y-1.5 flex-1">
                    {program.topics.map((topic) => (
                      <li key={topic} className="text-foreground/80">
                        · {topic}
                      </li>
                    ))}
                  </ul>
                  <Link href={program.href}>
                    <Button variant="outline" className="w-full group">
                      View programme
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/learning">
            <Button className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
              Browse all courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/payment-instructions">
            <Button variant="link" className="text-[#1e3a5f]">
              How to pay with MTN MoMo →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
