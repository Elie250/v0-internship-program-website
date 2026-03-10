'use client'

import { Users, CheckCircle, XCircle, Clock } from 'lucide-react'

interface StatsCardsProps {
  total: number
  accepted: number
  declined: number
  pending: number
  students: number
  individuals: number
}

export default function StatsCards({
  total,
  accepted,
  declined,
  pending,
  students,
  individuals,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={Users}
        label="Total Applications"
        value={total}
        bgColor="bg-blue-50"
        iconColor="text-blue-600"
        borderColor="border-blue-200"
      />
      <StatCard
        icon={CheckCircle}
        label="Accepted"
        value={accepted}
        bgColor="bg-green-50"
        iconColor="text-green-600"
        borderColor="border-green-200"
      />
      <StatCard
        icon={XCircle}
        label="Declined"
        value={declined}
        bgColor="bg-red-50"
        iconColor="text-red-600"
        borderColor="border-red-200"
      />
      <StatCard
        icon={Clock}
        label="Pending"
        value={pending}
        bgColor="bg-yellow-50"
        iconColor="text-yellow-600"
        borderColor="border-yellow-200"
      />
      <StatCard
        icon={Users}
        label="Students"
        value={students}
        bgColor="bg-indigo-50"
        iconColor="text-indigo-600"
        borderColor="border-indigo-200"
      />
      <StatCard
        icon={Users}
        label="Individuals"
        value={individuals}
        bgColor="bg-purple-50"
        iconColor="text-purple-600"
        borderColor="border-purple-200"
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  bgColor: string
  iconColor: string
  borderColor: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
  borderColor,
}: StatCardProps) {
  return (
    <div
      className={`p-6 rounded-lg border-2 ${borderColor} ${bgColor} transition-all hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon className={`${iconColor} w-8 h-8`} />
      </div>
    </div>
  )
}
