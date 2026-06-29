import { redirect } from 'next/navigation'
import { getAdminSession } from '@/app/actions/admin-context'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()
  if (!session) {
    redirect('/auth/login')
  }

  return <AdminShell session={session}>{children}</AdminShell>
}
