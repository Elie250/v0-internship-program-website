import { redirect } from 'next/navigation'
import { getAdminOverview } from '@/app/actions/admin-context'
import { AdminOverview } from '@/components/admin/admin-overview'

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview()
  if (!overview) {
    redirect('/auth/login')
  }

  return <AdminOverview stats={overview.stats} />
}
