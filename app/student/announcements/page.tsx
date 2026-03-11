'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Link from 'next/link';

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Welcome to Energy & Logics Academy',
    description: 'We are excited to have you on board. Check out our latest programs and updates.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    category: 'General'
  },
  {
    id: 2,
    title: 'Electrical Technology Program Updates',
    description: 'New curriculum and hands-on projects for the upcoming semester.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    category: 'Program'
  },
  {
    id: 3,
    title: 'Application Review Process',
    description: 'Learn how we review applications and what to expect next.',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    category: 'Process'
  }
];

export default function StudentAnnouncements() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Announcements</h1>

      <div className="space-y-4">
        {ANNOUNCEMENTS.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    {announcement.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{announcement.date}</p>
                </div>
                <Badge variant="outline">{announcement.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{announcement.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/student/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
