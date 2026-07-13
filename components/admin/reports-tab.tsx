'use client'

import { useEffect, useState } from 'react'
import { getAdminReportData } from '@/app/actions/admin-context'
import type { AdminReportData } from '@/lib/admin/data/admin-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReportsCharts } from '@/components/admin/reports-charts'
import {
  downloadAdminReportExcel,
  downloadAdminReportPdf,
} from '@/lib/admin/data/admin-report-export'
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  Download,
  ClipboardList,
  Zap,
  FileText,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react'

function StatRow({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <li className="flex justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold shrink-0 ${accent ?? ''}`}>{value}</span>
    </li>
  )
}

function StatusBar({ label, count, total, colorClass }: { label: string; count: number; total: number; colorClass: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm">{label}</p>
        <p className="font-semibold">{count}</p>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function ReportsTab({ initialData }: { initialData?: AdminReportData }) {
  const [report, setReport] = useState<AdminReportData | null>(initialData ?? null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) return
    fetchReportData()
  }, [initialData])

  const fetchReportData = async () => {
    setLoadError(null)
    try {
      const data = await getAdminReportData()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch report data:', error)
      setLoadError('Failed to refresh report data. Try reloading the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!report) return
    downloadAdminReportPdf(report)
  }

  const handleDownloadExcel = () => {
    if (!report) return
    downloadAdminReportExcel(report)
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading reports...</p>
  }

  if (!report) {
    return (
      <div className="space-y-2">
        <p className="text-slate-600">
          {loadError ?? 'Unable to load reports. Try reloading the page.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); fetchReportData() }}>
          Retry
        </Button>
      </div>
    )
  }

  const { stats, coursesByStatus, programmeNotifications, content } = report
  const staffAndOther = stats.users - stats.students
  const admissionRate =
    stats.courseEnrollments > 0
      ? Math.round((stats.admittedEnrollments / stats.courseEnrollments) * 100)
      : 0
  const publicationRate =
    stats.courses > 0 ? Math.round((coursesByStatus.published / stats.courses) * 100) : 0
  const enrollmentsAligned =
    programmeNotifications.pendingEnrollments === stats.pendingEnrollments

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Admin Reports & Analytics</h3>
          <p className="text-sm text-slate-600 mt-1">
            Metrics aligned with the dashboard overview and per-programme notifications.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Report
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                handleDownloadPdf()
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                handleDownloadExcel()
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download as Excel (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border border-border flex-wrap h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="w-4 h-4 mr-2" />
            Programmes
          </TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ClipboardList className="w-4 h-4 mr-2" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
                <p className="text-xs text-slate-600 mt-1">
                  {stats.students} students · {stats.lecturers} lecturers · {stats.engineers} engineers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.courseEnrollments}</div>
                <p className="text-xs text-slate-600 mt-1">
                  {stats.admittedEnrollments} admitted · {stats.pendingEnrollments} pending review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Payments</CardTitle>
                <BookOpen className="w-4 h-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedPaymentsTotal.toLocaleString()} RWF</div>
                <p className="text-xs text-slate-600 mt-1">{stats.pendingPayments} receipts awaiting review</p>
              </CardContent>
            </Card>
          </div>

          <ReportsCharts report={report} />

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Admission rate</p>
                  <p className="text-2xl font-bold">{admissionRate}%</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Publication rate</p>
                  <p className="text-2xl font-bold">{publicationRate}%</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Programme action items</p>
                  <p className="text-2xl font-bold">{programmeNotifications.total}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Certificates to approve</p>
                  <p className="text-2xl font-bold">{stats.pendingCertificates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusBar label="Students" count={stats.students} total={stats.users} colorClass="bg-primary" />
                <StatusBar label="Staff & other roles" count={staffAndOther} total={stats.users} colorClass="bg-secondary" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <StatRow label="Total registered" value={stats.users} />
                  <StatRow label="Students" value={stats.students} accent="text-green-600" />
                  <StatRow label="Lecturers" value={stats.lecturers} />
                  <StatRow label="Engineers" value={stats.engineers} />
                  <StatRow label="Staff awaiting approval" value={stats.pendingStaffApprovals} accent="text-amber-600" />
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusBar label="Published" count={coursesByStatus.published} total={stats.courses} colorClass="bg-primary" />
                <StatusBar
                  label="Pending review"
                  count={coursesByStatus.pendingReview}
                  total={stats.courses}
                  colorClass="bg-blue-500"
                />
                <StatusBar label="Draft" count={coursesByStatus.draft} total={stats.courses} colorClass="bg-secondary" />
                <StatusBar label="Archived" count={coursesByStatus.archived} total={stats.courses} colorClass="bg-slate-400" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Programme Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <StatRow label="Programmes needing attention" value={programmeNotifications.coursesNeedingAttention} />
                  <StatRow label="Lecturer submissions (pending review)" value={coursesByStatus.pendingReview} />
                  <StatRow label="Draft programmes" value={coursesByStatus.draft} />
                  <StatRow label="Pending enrollments (sum by programme)" value={programmeNotifications.pendingEnrollments} />
                  <StatRow label="Pending certificates (sum by programme)" value={programmeNotifications.pendingCertificates} />
                  <StatRow label="Total notification items" value={programmeNotifications.total} accent="text-red-600" />
                </ul>
                {!enrollmentsAligned ? (
                  <p className="text-xs text-amber-700 mt-4">
                    Note: global pending enrollments ({stats.pendingEnrollments}) differs from per-programme sum (
                    {programmeNotifications.pendingEnrollments}). Refresh after payment repairs complete.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                <StatRow label="Total enrollments" value={stats.courseEnrollments} />
                <StatRow label="Admitted" value={stats.admittedEnrollments} accent="text-green-600" />
                <StatRow label="Pending payment review" value={stats.pendingEnrollments} accent="text-amber-600" />
                <StatRow label="Certificates awaiting admin" value={stats.pendingCertificates} accent="text-amber-600" />
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payments & Admissions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <StatRow label="Pending payment receipts" value={stats.pendingPayments} />
                  <StatRow
                    label="Verified revenue (RWF)"
                    value={stats.approvedPaymentsTotal.toLocaleString()}
                    accent="text-green-600"
                  />
                  <StatRow label="Internship applications" value={stats.applications} />
                  <StatRow label="Support tickets" value={stats.supportTickets} />
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shop & Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <StatRow label="Active products" value={stats.products} />
                  <StatRow label="Low-stock alerts" value={stats.lowStockProducts} accent="text-amber-600" />
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Energy Library</CardTitle>
                <Zap className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <StatRow label="Total items" value={content.libraryTotal} />
                  <StatRow label="Published" value={content.libraryPublished} accent="text-green-600" />
                  <StatRow label="Pending review" value={content.libraryPendingReview} accent="text-amber-600" />
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Field Notes</CardTitle>
                <FileText className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <StatRow label="Total articles" value={content.engineeringArticlesTotal} />
                  <StatRow label="Published" value={content.engineeringArticlesPublished} accent="text-green-600" />
                  <StatRow label="Announcements (public site)" value={stats.announcements} />
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
