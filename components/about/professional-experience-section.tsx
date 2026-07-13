import {
  Award,
  Briefcase,
  Building2,
  Cpu,
  GraduationCap,
  Handshake,
  Zap,
} from 'lucide-react'
import { COMPANY, COMPANY_EXPERIENCE } from '@/lib/company/constants'

const STAT_ICONS = [Zap, GraduationCap, Briefcase, Building2] as const

const CAPABILITY_ICONS = [Cpu, Zap, Award] as const

export function ProfessionalExperienceSection() {
  const { title, subtitle, stats, milestones, capabilities, partners } = COMPANY_EXPERIENCE

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

      <div className="border-b border-slate-100 bg-[var(--brand-navy)] px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-sky)] mb-2">
          Industry-aligned training
        </p>
        <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-3xl">{subtitle}</p>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => {
            const Icon = STAT_ICONS[index] ?? Briefcase
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-4 sm:px-4 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-[var(--brand-sky)] mb-2" aria-hidden="true" />
                <p className="text-2xl sm:text-3xl font-bold text-white leading-none">{stat.value}</p>
                <p className="text-xs text-white/75 mt-2 leading-snug">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Experience timeline
          </p>
          <ol className="space-y-0">
            {milestones.map((item, index) => (
              <li key={item.title} className="relative flex gap-4 pb-6 last:pb-0">
                {index < milestones.length - 1 ? (
                  <span
                    className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--brand-navy)] bg-white"
                  aria-hidden="true"
                />
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold text-[var(--brand-navy)]">{item.period}</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-5 sm:p-6 bg-slate-50/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Core capabilities
          </p>
          <ul className="space-y-4">
            {capabilities.map((capability, index) => {
              const Icon = CAPABILITY_ICONS[index] ?? Cpu
              return (
                <li
                  key={capability.title}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-[var(--brand-navy)]" aria-hidden="true" />
                    <p className="font-semibold text-sm text-slate-900">{capability.title}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {capability.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-slate-600">
                        <span className="mt-2 h-1 w-1 rounded-full bg-[var(--brand-navy)] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-slate-700 shrink-0">
            <Handshake className="h-4 w-4 text-[var(--brand-navy)]" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trusted partnerships
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {partners.map((partner) => (
              <span
                key={partner}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-800"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
