'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AdminReportData } from '@/lib/admin/data/admin-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#1e3a5f', '#1f7a8c', '#f2a900', '#64748b', '#94a3b8']

export function ReportsCharts({ report }: { report: AdminReportData }) {
  const { stats, coursesByStatus, programmeNotifications, content } = report

  const userData = [
    { name: 'Students', value: stats.students },
    { name: 'Lecturers', value: stats.lecturers },
    { name: 'Engineers', value: stats.engineers },
    {
      name: 'Other',
      value: Math.max(0, stats.users - stats.students - stats.lecturers - stats.engineers),
    },
  ].filter((row) => row.value > 0)

  const courseStatusData = [
    { name: 'Published', value: coursesByStatus.published },
    { name: 'Pending review', value: coursesByStatus.pendingReview },
    { name: 'Draft', value: coursesByStatus.draft },
    { name: 'Archived', value: coursesByStatus.archived },
  ].filter((row) => row.value > 0)

  const enrollmentData = [
    { name: 'Admitted', value: stats.admittedEnrollments },
    { name: 'Pending review', value: stats.pendingEnrollments },
    {
      name: 'Other',
      value: Math.max(
        0,
        stats.courseEnrollments - stats.admittedEnrollments - stats.pendingEnrollments
      ),
    },
  ].filter((row) => row.value > 0)

  const contentData = [
    { name: 'Library', value: content.libraryTotal },
    { name: 'Field Notes', value: content.engineeringArticlesTotal },
    { name: 'Announcements', value: stats.announcements },
  ].filter((row) => row.value > 0)

  const actionItemsData = [
    { name: 'Programme items', value: programmeNotifications.total },
    { name: 'Certificates', value: stats.pendingCertificates },
    { name: 'Payments', value: stats.pendingPayments },
    { name: 'Staff approvals', value: stats.pendingStaffApprovals },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User roles</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {userData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {userData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">No user data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programme status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {courseStatusData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">No programmes yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollments</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {enrollmentData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={enrollmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80}>
                  {enrollmentData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">No enrollments yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action queue</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actionItemsData} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1f7a8c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
