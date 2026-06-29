import { redirect } from 'next/navigation'
import { getAdminSession } from '@/app/actions/admin-context'
import { AdminShell } from '@/components/admin/admin-shell'
import { getCompanyLogoUrl } from '@/lib/platform/branding'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()
  if (!session) {
    redirect('/auth/login')
  }

  const logoUrl = await getCompanyLogoUrl()

  return (
    <AdminShell session={session} logoUrl={logoUrl}>
      {children}
    </AdminShell>
  )
}
