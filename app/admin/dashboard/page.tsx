import { supabaseAdmin } from '@/lib/supabaseAdmin'
import DashboardClient from './client'
import StatsCards from '@/components/dashboard/stats-cards'
import AnalyticsSection from '@/components/dashboard/analytics-section'
import { Registration } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const { data, error } = await supabaseAdmin
    .from<Registration>('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-xl p-10 text-center">
          <p className="text-gray-700 font-medium">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const total = data.length
  const accepted = data.filter(d => d.status === 'accepted').length
  const declined = data.filter(d => d.status === 'declined').length
  const pending = data.filter(d => !d.status || d.status === 'pending').length
  const students = data.filter(d => d.registration_type === 'Student').length
  const individuals = data.filter(d => d.registration_type === 'Individual').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10 space-y-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Energy & Logics Admin</h1>
            <p className="text-slate-600 mt-1">Manage applications and track registrations</p>
          </div>
          <div className="bg-white shadow-md rounded-lg px-4 py-2 text-sm text-slate-600">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <StatsCards total={total} accepted={accepted} declined={declined} pending={pending} students={students} individuals={individuals} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AnalyticsSection registrations={data} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Applications</h2>
            <span className="text-sm text-slate-500">{total} total registrations</span>
          </div>
          <DashboardClient registrations={data} />
        </div>
      </div>
    </div>
  )
}