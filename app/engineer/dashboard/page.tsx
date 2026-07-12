'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, Home, Users, Bot, Headphones, Wrench, BookOpen } from 'lucide-react';
import type { SupportAccessSummary } from '@/lib/support/types';
import { EngineerCommunityPanel } from '@/components/engineer/engineer-community';
import { EngineerAiAssistant } from '@/components/engineer/engineer-ai-assistant';
import { EngineerFieldNotesPanel } from '@/components/engineer/engineer-field-notes-panel';

export default function EngineerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [supportAccess, setSupportAccess] = useState<SupportAccessSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser || currentUser.role !== 'engineer') {
        router.push('/auth/login?redirect=/engineer/dashboard');
        return;
      }

      setUser(currentUser);

      try {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Engineer Community Hub</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user.firstName} {user.lastName}
            </p>
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

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary mb-1">Your membership</h2>
              {supportAccess?.hasActiveSubscription ? (
                <p className="text-sm text-slate-700">
                  <strong>{supportAccess.subscription?.plan?.name}</strong>
                  {supportAccess.planTier === 'free' ? ' (Free)' : ' (Paid)'}
                  {supportAccess.subscription?.ends_at
                    ? ` · until ${new Date(supportAccess.subscription.ends_at).toLocaleDateString()}`
                    : ''}
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  Join the free community plan or upgrade for tickets, AI, and posting.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {supportAccess?.hasActiveSubscription ? (
                <Badge className={supportAccess.planTier === 'paid' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}>
                  {supportAccess.planTier === 'paid' ? 'Paid member' : 'Free member'}
                </Badge>
              ) : null}
              <Button variant="outline" asChild>
                <Link href="/subscriber">Open subscriber hub</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/engineering-support">
                  {supportAccess?.hasActiveSubscription ? 'Manage plan' : 'Choose a plan'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="community" className="space-y-4">
          <TabsList className="bg-card border border-border flex flex-wrap h-auto">
            <TabsTrigger value="community" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Community
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bot className="w-4 h-4 mr-2" />
              AI assistant
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Headphones className="w-4 h-4 mr-2" />
              Human support
            </TabsTrigger>
            <TabsTrigger value="field-notes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              Field Notes
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Wrench className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community">
            <EngineerCommunityPanel access={supportAccess} />
          </TabsContent>

          <TabsContent value="ai">
            <EngineerAiAssistant access={supportAccess} />
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardContent className="py-8 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Engineer support tickets</h3>
                {supportAccess?.canSubmitTicket ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Paid plans include human engineer review with SLA. Open tickets on the support portal.
                    </p>
                    <Button asChild className="bg-primary">
                      <Link href="/engineering-support">Open support portal</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Support tickets require a paid plan. Free members can use the community and AI assistant.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/engineering-support">Upgrade plan</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="field-notes">
            <EngineerFieldNotesPanel />
          </TabsContent>

          <TabsContent value="tools">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Technical resources and project library — coming soon.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
