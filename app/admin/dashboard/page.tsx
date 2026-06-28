'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, Megaphone, BarChart3, LogOut, Zap, Home, ShoppingBag, FolderTree, Headphones } from 'lucide-react';
import dynamic from 'next/dynamic';

const UserManagementTab = dynamic(() => import('@/components/admin/user-management'), { ssr: false });
const CourseManagementTab = dynamic(() => import('@/components/admin/course-management'), { ssr: false });
const AnnouncementTab = dynamic(() => import('@/components/admin/announcement-management'), { ssr: false });
const ReportsTab = dynamic(() => import('@/components/admin/reports-tab'), { ssr: false });
const ServiceManagement = dynamic(() => import('@/components/admin/service-management'), { ssr: false });
const ProductManagement = dynamic(() => import('@/components/admin/product-management'), { ssr: false });
const CategoryManagement = dynamic(() => import('@/components/admin/category-management'), { ssr: false });
const SupportManagement = dynamic(() => import('@/components/admin/support-management'), { ssr: false });

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, courses: 0, announcements: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Fetch stats
      try {
        const supabase = createClient();
        
        const [userRes, courseRes, announcementRes] = await Promise.all([
          supabase.from('users').select('count', { count: 'exact' }),
          supabase.from('courses').select('count', { count: 'exact' }),
          supabase.from('announcements').select('count', { count: 'exact' }),
        ]);

        setStats({
          users: userRes.count || 0,
          courses: courseRes.count || 0,
          announcements: announcementRes.count || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.firstName} {user.lastName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground mt-1">Active users on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courses}</div>
              <p className="text-xs text-muted-foreground mt-1">Published courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Megaphone className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.announcements}</div>
              <p className="text-xs text-muted-foreground mt-1">Active announcements</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="services" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FolderTree className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Headphones className="w-4 h-4 mr-2" />
              Support
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <CourseManagementTab />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <AnnouncementTab />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <SupportManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
