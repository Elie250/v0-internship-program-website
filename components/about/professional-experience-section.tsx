import Image from 'next/image'
import { Briefcase, Cpu, GraduationCap, Handshake, Zap } from 'lucide-react'
import { COMPANY, COMPANY_EXPERIENCE } from '@/lib/company/constants'

const STAT_ICONS = [Zap, GraduationCap, Briefcase] as const

export function ProfessionalExperienceSection() {
  const { title, subtitle, stats, capabilities, partners } = COMPANY_EXPERIENCE

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      aria-labelledby="professional-experience-heading"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-100/80 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1.5 shrink-0" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-red-400/90" />
            <span className="h-3 w-3 rounded-full bg-amber-400/90" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {COMPANY.brandName}
            </p>
            <h2
              id="professional-experience-heading"
              className="text-sm sm:text-base font-semibold text-slate-900 truncate"
            >
              {title}
            </h2>
          </div>
        </div>
        <span className="hidden sm:inline text-xs text-slate-500 shrink-0">{COMPANY.region}</span>
      </div>

      <div className="border-b border-slate-100 bg-[var(--brand-navy)] px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl">{subtitle}</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((stat, index) => {
            const Icon = STAT_ICONS[index] ?? Briefcase
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-[var(--brand-sky)] mb-2" aria-hidden="true" />
                <p className="text-2xl font-bold text-white leading-none">{stat.value}</p>
                <p className="text-xs text-white/75 mt-1.5 leading-snug">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {capabilities.map((capability) => (
          <div key={capability.title} className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-[var(--brand-navy)]" aria-hidden="true" />
              <p className="font-semibold text-sm text-slate-900">{capability.title}</p>
            </div>
            <ul className="space-y-1">
              {capability.items.map((item) => (
                <li key={item} className="text-sm text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2 mb-4">
          <Handshake className="h-4 w-4 text-[var(--brand-navy)]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Trusted partners
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className={`relative h-16 w-40 sm:h-20 sm:w-48 rounded-lg border border-slate-200 overflow-hidden ${partner.logoBg}`}
            >
              <Image
                src={partner.logo}
                alt={`${partner.name} logo`}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 160px, 192px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
