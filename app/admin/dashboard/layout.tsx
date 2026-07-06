import { redirect } from 'next/navigation'
import { getAdminSession } from '@/app/actions/admin-context'
import { getCurrentUser } from '@/app/actions/auth-service'
import { isDeliveryRole } from '@/lib/admin/access-control'
import { AdminShell } from '@/components/admin/admin-shell'
import { getCompanyLogoUrl } from '@/lib/platform/branding'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()
  if (!session) {
    const user = await getCurrentUser()
    if (user && isDeliveryRole(user.role)) {
      redirect('/lecturer/dashboard')
    }
    redirect('/auth/login')
  }

  const logoUrl = await getCompanyLogoUrl()

  return (
    <AdminShell session={session} logoUrl={logoUrl}>
      {children}
    </AdminShell>
  )
}
