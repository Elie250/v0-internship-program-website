'use client'

import { useEffect, useState } from 'react'
import { getAdminStats } from '@/app/actions/admin-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, BookOpen, TrendingUp, Download } from 'lucide-react';

interface ReportData {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalAnnouncements: number;
  totalEnrollments: number;
}

export default function ReportsTab() {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalAnnouncements: 0,
    totalEnrollments: 0,
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
        activeUsers: stats.users,
        totalCourses: stats.courses,
        publishedCourses: stats.publishedCourses,
        totalAnnouncements: stats.announcements,
        totalEnrollments: stats.applications,
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
Active Users: ${reportData.activeUsers}
Inactive Users: ${reportData.totalUsers - reportData.activeUsers}

COURSE STATISTICS
================
Total Courses: ${reportData.totalCourses}
Published Courses: ${reportData.publishedCourses}
Draft Courses: ${reportData.totalCourses - reportData.publishedCourses}

ANNOUNCEMENTS
=============
Total Announcements: ${reportData.totalAnnouncements}

ENROLLMENT DATA
===============
Total Enrollments: ${reportData.totalEnrollments}
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
    return <p className="text-muted-foreground">Loading reports...</p>;
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
                <p className="text-xs text-muted-foreground mt-1">{reportData.activeUsers} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
                <BookOpen className="w-4 h-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">{reportData.publishedCourses} published</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
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
                  <p className="text-sm text-muted-foreground mb-1">User Engagement Rate</p>
                  <p className="text-2xl font-bold">
                    {reportData.totalUsers > 0 ? Math.round((reportData.activeUsers / reportData.totalUsers) * 100) : 0}%
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Course Publication Rate</p>
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
                    <p className="text-sm">Active Users</p>
                    <p className="font-semibold">{reportData.activeUsers}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${reportData.totalUsers > 0 ? (reportData.activeUsers / reportData.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Inactive Users</p>
                    <p className="font-semibold">{reportData.totalUsers - reportData.activeUsers}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${reportData.totalUsers > 0 ? ((reportData.totalUsers - reportData.activeUsers) / reportData.totalUsers) * 100 : 0}%` }}
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
                    <span className="text-muted-foreground">Total Registered</span>
                    <span className="font-semibold">{reportData.totalUsers}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-semibold text-green-600">{reportData.activeUsers}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Inactive</span>
                    <span className="font-semibold text-yellow-600">{reportData.totalUsers - reportData.activeUsers}</span>
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
                    <span className="text-muted-foreground">Total Courses</span>
                    <span className="font-semibold">{reportData.totalCourses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-semibold text-green-600">{reportData.publishedCourses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Draft</span>
                    <span className="font-semibold text-yellow-600">{reportData.totalCourses - reportData.publishedCourses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Total Enrollments</span>
                    <span className="font-semibold">{reportData.totalEnrollments}</span>
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
