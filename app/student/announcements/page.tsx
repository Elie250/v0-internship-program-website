import { redirect } from 'next/navigation'

export default function StudentAnnouncementsRedirect() {
  redirect('/student/dashboard?tab=announcements')
}
