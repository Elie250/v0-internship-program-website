import { supabaseAdmin } from '@/lib/supabaseAdmin'
import DashboardTable from './table'
import StatsCards from '@/components/dashboard/stats-cards'
import AnalyticsSection from '@/components/dashboard/analytics-section'

export const dynamic = 'force-dynamic' // Always fetch fresh data

export default async function Dashboard() {
  const { data, error } = await supabaseAdmin
    .from('applications') // updated table
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-xl p-10 text-center">
          <p className="text-gray-700 font-medium">
            Failed to load dashboard data
          </p>
        </div>
      </div>
    )
  }

  // Statistics
  const total = data.length
  const accepted = data.filter((d: any) => d.status === 'accepted').length
  const declined = data.filter((d: any) => d.status === 'declined').length
  const pending = data.filter((d: any) => d.status === 'pending' || !d.status).length

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Energy & Logics Admin
            </h1>
            <p className="text-slate-600 mt-1">
              Manage applications and track registrations
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg px-4 py-2 text-sm text-slate-600">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        {/* Stats Cards */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <StatsCards
            total={total}
            accepted={accepted}
            declined={declined}
            pending={pending}
            students={data.filter((d: any) => d.current_level === 'secondary' || d.current_level === 'technician').length}
            individuals={data.filter((d: any) => d.current_level === 'bachelor' || d.current_level === 'professional').length}
          />
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AnalyticsSection registrations={data} />
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Applications</h2>
            <span className="text-sm text-slate-500">{total} total applications</span>
          </div>

          <DashboardTable registrations={data} /> {/* pass all applications */}
        </div>

      </div>
    </div>
  )
}