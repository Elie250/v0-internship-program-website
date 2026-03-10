import { supabaseAdmin } from '@/lib/supabaseAdmin'
import DashboardTable from './table'
import StatsCards from '@/components/dashboard/stats-cards'
import AnalyticsSection from '@/components/dashboard/analytics-section'

export const revalidate = 3600 // Revalidate every hour

export default async function Dashboard() {
  const { data } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
        <div className="text-center">
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const total = data.length
  const accepted = data.filter((d: any) => d.status === 'accepted').length
  const declined = data.filter((d: any) => d.status === 'declined').length
  const pending = data.filter((d: any) => d.status === 'pending' || !d.status).length
  const students = data.filter((d: any) => d.registration_type === 'Student').length
  const individuals = data.filter((d: any) => d.registration_type === 'Individual').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Energy & Logics Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage applications and track registrations</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          total={total}
          accepted={accepted}
          declined={declined}
          pending={pending}
          students={students}
          individuals={individuals}
        />

        {/* Analytics Section */}
        <AnalyticsSection registrations={data} />

        {/* Table Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">All Applications</h2>
          <DashboardTable registrations={data || []} />
        </div>
      </div>
    </div>
  )
}
