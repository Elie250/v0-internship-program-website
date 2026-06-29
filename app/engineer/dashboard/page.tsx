'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, LogOut, Home, Headphones } from 'lucide-react';
import type { SupportAccessSummary } from '@/lib/support/types';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
}

export default function EngineerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supportAccess, setSupportAccess] = useState<SupportAccessSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'engineer') {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('is_advertised', true)
          .order('created_at', { ascending: false });

        setProjects(data || []);

        const accessRes = await fetch('/api/support/subscribe', { credentials: 'same-origin' });
        if (accessRes.ok) {
          setSupportAccess(await accessRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Engineer Portal</h1>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary mb-2">Technical Resources Portal</h2>
              <p className="text-muted-foreground">Projects, documentation, and engineering support</p>
            </div>
            <Button asChild className="bg-primary">
              <Link href="/engineering-support">
                <Headphones className="w-4 h-4 mr-2" />
                Engineering support
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-8 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Support subscription</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            {supportAccess?.hasActiveSubscription ? (
              <>
                <p className="text-sm text-slate-700">
                  <strong>{supportAccess.subscription?.plan?.name}</strong> active
                  {supportAccess.subscription?.ends_at
                    ? ` until ${new Date(supportAccess.subscription.ends_at).toLocaleDateString()}`
                    : ''}
                  {supportAccess.ticketsRemaining != null
                    ? ` · ${supportAccess.ticketsRemaining} tickets left`
                    : ''}
                </p>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </>
            ) : supportAccess?.subscription?.status === 'payment_pending_review' ? (
              <>
                <p className="text-sm text-amber-800">Receipt submitted — awaiting admin verification.</p>
                <Badge className="bg-amber-100 text-amber-900">Pending</Badge>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Subscribe to submit engineering help requests (PLC, electrical, embedded, etc.).
                </p>
                <Button variant="outline" asChild>
                  <Link href="/engineering-support">View plans</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No projects available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition">
                    <CardHeader>
                      <div className="space-y-2">
                        <CardTitle>{project.title}</CardTitle>
                        {project.category && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded w-fit">
                            {project.category}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm">{project.description}</p>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        View Project Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Technical Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Documentation, guides, and technical materials</p>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Engineering Standards
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Technical Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Reference Materials
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
