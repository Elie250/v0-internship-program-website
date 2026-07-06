'use client'

import { useEffect, useState } from 'react'
import { getAdminStats } from '@/app/actions/admin-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, BookOpen, TrendingUp, Download } from 'lucide-react';

interface ReportData {
  totalUsers: number;
  students: number;
  totalCourses: number;
  publishedCourses: number;
  totalAnnouncements: number;
  courseEnrollments: number;
  admittedEnrollments: number;
  pendingEnrollments: number;
  pendingPayments: number;
  approvedPaymentsTotal: number;
  applications: number;
}

export default function ReportsTab() {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    students: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalAnnouncements: 0,
    courseEnrollments: 0,
    admittedEnrollments: 0,
    pendingEnrollments: 0,
    pendingPayments: 0,
    approvedPaymentsTotal: 0,
    applications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const stats = await getAdminStats()

      setReportData({
        totalUsers: stats.users,
        students: stats.students,
        totalCourses: stats.courses,
        publishedCourses: stats.publishedCourses,
        totalAnnouncements: stats.announcements,
        courseEnrollments: stats.courseEnrollments,
        admittedEnrollments: stats.admittedEnrollments,
        pendingEnrollments: stats.pendingEnrollments,
        pendingPayments: stats.pendingPayments,
        approvedPaymentsTotal: stats.approvedPaymentsTotal,
        applications: stats.applications,
      })
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = () => {
    const reportContent = `
Energy & Logics Academy - Admin Report
Generated: ${new Date().toLocaleString()}

USER STATISTICS
===============
Total Users: ${reportData.totalUsers}
Students: ${reportData.students}

COURSE STATISTICS
================
Total Courses: ${reportData.totalCourses}
Published Courses: ${reportData.publishedCourses}

ENROLLMENTS & PAYMENTS
======================
Course Enrollments: ${reportData.courseEnrollments}
Admitted: ${reportData.admittedEnrollments}
Pending payment review: ${reportData.pendingEnrollments}
Pending payment receipts: ${reportData.pendingPayments}
Verified revenue (RWF): ${reportData.approvedPaymentsTotal.toLocaleString()}
Internship applications: ${reportData.applications}

ANNOUNCEMENTS
=============
Total Announcements: ${reportData.totalAnnouncements}
`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `admin-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return <p className="text-slate-600">Loading reports...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Admin Reports & Analytics</h3>
        <Button onClick={handleDownloadReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border border-border">
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
            Courses
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalUsers}</div>
                <p className="text-xs text-slate-600 mt-1">{reportData.students} students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.courseEnrollments}</div>
                <p className="text-xs text-slate-600 mt-1">
                  {reportData.admittedEnrollments} admitted · {reportData.pendingEnrollments} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Payments</CardTitle>
                <BookOpen className="w-4 h-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.approvedPaymentsTotal.toLocaleString()} RWF</div>
                <p className="text-xs text-slate-600 mt-1">{reportData.pendingPayments} receipts awaiting review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Admission rate</p>
                  <p className="text-2xl font-bold">
                    {reportData.courseEnrollments > 0
                      ? Math.round((reportData.admittedEnrollments / reportData.courseEnrollments) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Course Publication Rate</p>
                  <p className="text-2xl font-bold">
                    {reportData.totalCourses > 0 ? Math.round((reportData.publishedCourses / reportData.totalCourses) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Students</p>
                    <p className="font-semibold">{reportData.students}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${reportData.totalUsers > 0 ? (reportData.students / reportData.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Staff & other roles</p>
                    <p className="font-semibold">{reportData.totalUsers - reportData.students}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${reportData.totalUsers > 0 ? ((reportData.totalUsers - reportData.students) / reportData.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="text-slate-600">Total Registered</span>
                    <span className="font-semibold">{reportData.totalUsers}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Students</span>
                    <span className="font-semibold text-green-600">{reportData.students}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Other roles</span>
                    <span className="font-semibold text-yellow-600">{reportData.totalUsers - reportData.students}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Published</p>
                    <p className="font-semibold">{reportData.publishedCourses}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${reportData.totalCourses > 0 ? (reportData.publishedCourses / reportData.totalCourses) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Draft</p>
                    <p className="font-semibold">{reportData.totalCourses - reportData.publishedCourses}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${reportData.totalCourses > 0 ? ((reportData.totalCourses - reportData.publishedCourses) / reportData.totalCourses) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="text-slate-600">Total Courses</span>
                    <span className="font-semibold">{reportData.totalCourses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Published</span>
                    <span className="font-semibold text-green-600">{reportData.publishedCourses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Draft</span>
                    <span className="font-semibold text-yellow-600">{reportData.totalCourses - reportData.publishedCourses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Total Enrollments</span>
                    <span className="font-semibold">{reportData.courseEnrollments}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
