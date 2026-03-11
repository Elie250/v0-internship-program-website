'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentCertificates() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">My Certificates</h1>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Certificates Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your certificates will appear here once you complete your program.
          </p>
          <p className="text-sm text-muted-foreground">
            Upon successful completion of your internship, you'll receive a digital certificate that you can download and share with your network.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Completed Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven't completed any programs yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Start your application to begin your engineering journey!
            </p>
          </div>
        </CardContent>
      </Card>

      <Link href="/student/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
