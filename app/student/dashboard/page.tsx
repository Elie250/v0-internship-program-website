'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Award, Bell, LogOut, User } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  program: string;
  duration: string;
  is_published: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'student') {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Fetch courses and announcements
      try {
        const supabase = createClient();
        
        const [coursesRes, announcementsRes] = await Promise.all([
          supabase.from('courses').select('*').eq('is_published', true),
          supabase.from('announcements').select('*').eq('is_featured', true).order('created_at', { ascending: false }).limit(5),
        ]);

        setCourses(coursesRes.data || []);
        setAnnouncements(announcementsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
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
            <h1 className="text-2xl font-bold text-primary">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.firstName} {user.lastName}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">Welcome to Energy & Logics Academy</h2>
                <p className="text-muted-foreground">Explore courses and stay updated with announcements</p>
              </div>
              <User className="w-12 h-12 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              Available Courses
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            {courses.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No courses available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition">
                    <CardHeader>
                      <div className="space-y-2">
                        <CardTitle>{course.title}</CardTitle>
                        {course.program && (
                          <Badge variant="secondary">{course.program}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm">{course.description}</p>
                      {course.duration && (
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Duration:</span> {course.duration}
                        </p>
                      )}
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        View Course
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No announcements yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{announcement.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Certificates will appear here once you complete courses</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
