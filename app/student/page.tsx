'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function StudentPortalPage() {
  // Sample public internship updates
  const updates = [
    {
      id: 1,
      title: 'Software Engineering Internship 2026',
      description: '3-month internship with hands-on projects at top tech companies.',
    },
    {
      id: 2,
      title: 'Mechanical Engineering Internship',
      description: 'Work on real mechanical design and fabrication projects.',
    },
    {
      id: 3,
      title: 'Data Science Summer Program',
      description: 'Gain experience with data analysis and machine learning projects.',
    },
    {
      id: 4,
      title: 'Electrical Engineering Internship',
      description: 'Work with professional teams on electrical systems and circuits.',
    },
  ];

  return (
    <main className="min-h-screen bg-blue-50 text-gray-900 flex flex-col">
      {/* Top Bar with Login */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end">
          <Link href="YOUR_LOGIN_LINK_HERE">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Internship Updates */}
      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {updates.map((update) => (
          <Card key={update.id} className="bg-white shadow-md rounded-xl border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">{update.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 mb-4">{update.description}</CardDescription>
              <Link href="YOUR_LOGIN_LINK_HERE">
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                  Apply Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}