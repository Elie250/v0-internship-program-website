'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StatusDistributionProps {
  data: Array<{
    name: string
    value: number
  }>
}

export default function StatusDistribution({ data }: StatusDistributionProps) {
  const chartData = [
    {
      status: 'Accepted',
      value: data.find((d) => d.name === 'accepted')?.value || 0,
    },
    {
      status: 'Declined',
      value: data.find((d) => d.name === 'declined')?.value || 0,
    },
    {
      status: 'Pending',
      value: data.find((d) => d.name === 'pending')?.value || 0,
    },
  ]

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Overview</h3>
      {chartData.every((d) => d.value === 0) ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip formatter={(value) => `${value} applications`} />
            <Legend />
            <Bar dataKey="value" fill="#0066cc" name="Count" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
