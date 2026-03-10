'use client'

import ProgramChart from './program-chart'
import StatusDistribution from './status-distribution'
import TimelineChart from './timeline-chart'
import RegistrationTypeChart from './registration-type-chart'

interface AnalyticsSectionProps {
  registrations: any[]
}

export default function AnalyticsSection({ registrations }: AnalyticsSectionProps) {
  // Calculate program distribution
  const programData = Object.entries(
    registrations.reduce(
      (acc: Record<string, number>, reg: any) => {
        const program = reg.program || reg.training_program || 'Other'
        acc[program] = (acc[program] || 0) + 1
        return acc
      },
      {}
    )
  )
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)

  // Calculate status distribution
  const statusData = Object.entries(
    registrations.reduce(
      (acc: Record<string, number>, reg: any) => {
        const status = reg.status || 'pending'
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {}
    )
  ).map(([name, value]) => ({ name, value: value as number }))

  // Calculate timeline data (applications per day)
  const timelineData: Record<string, number> = {}
  registrations.forEach((reg: any) => {
    if (reg.created_at) {
      const date = new Date(reg.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      timelineData[date] = (timelineData[date] || 0) + 1
    }
  })

  const timelineChartData = Object.entries(timelineData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14) // Last 14 days

  // Calculate registration types
  const students = registrations.filter((r: any) => r.registration_type === 'Student').length
  const individuals = registrations.filter((r: any) => r.registration_type === 'Individual')
    .length

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgramChart data={programData} />
        <StatusDistribution data={statusData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimelineChart data={timelineChartData} />
        <RegistrationTypeChart students={students} individuals={individuals} />
      </div>
    </div>
  )
}
