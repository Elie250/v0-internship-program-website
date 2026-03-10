'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface RegistrationTypeChartProps {
  students: number
  individuals: number
}

export default function RegistrationTypeChart({
  students,
  individuals,
}: RegistrationTypeChartProps) {
  const data = [
    { name: 'Students', value: students },
    { name: 'Individuals', value: individuals },
  ]

  const COLORS = ['#0066cc', '#00c853']

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Type Distribution</h3>
      {students + individuals === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} applications`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
