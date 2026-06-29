import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'

export default async function PublicEnrollRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const studentEnroll = `/student/courses/${id}/enroll`

  if (user?.role === 'student' || user?.role === 'registered') {
    redirect(studentEnroll)
  }

  redirect(`/auth/login?redirect=${encodeURIComponent(studentEnroll)}`)
}
