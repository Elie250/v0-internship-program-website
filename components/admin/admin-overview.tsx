import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Headphones,
  Megaphone,
  ShoppingBag,
  Users,
} from 'lucide-react'
import type { AdminStats } from '@/app/actions/admin-context'

export function AdminOverview({ stats }: { stats: AdminStats }) {
  const cards = [
    { label: 'Users', value: stats.users, icon: Users, hint: `${stats.students} students` },
    { label: 'Course enrollments', value: stats.courseEnrollments, icon: GraduationCap, hint: `${stats.admittedEnrollments} admitted · ${stats.pendingEnrollments} pending payment` },
    { label: 'Pending payments', value: stats.pendingPayments, icon: CreditCard, hint: `${stats.approvedPaymentsTotal.toLocaleString()} RWF verified total` },
    { label: 'Courses', value: stats.courses, icon: BookOpen, hint: `${stats.publishedCourses} published` },
    { label: 'Applications', value: stats.applications, icon: ClipboardList, hint: 'Internship / program applications' },
    { label: 'Products', value: stats.products, icon: ShoppingBag, hint: 'Shop catalog' },
    { label: 'Announcements', value: stats.announcements, icon: Megaphone, hint: 'Published content' },
    { label: 'Support tickets', value: stats.supportTickets, icon: Headphones, hint: 'Open pipeline' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Platform snapshot — counts loaded in parallel for faster rendering.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
