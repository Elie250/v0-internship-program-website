'use client';

import Link from 'next/link';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegistrationSuccess() {
  const email = typeof window !== 'undefined' ? localStorage.getItem('student_email') : '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-4xl text-green-600 mb-4">Registration Successful!</CardTitle>
            <p className="text-slate-600 text-lg">
              Your internship application has been submitted successfully
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pb-12">
            {/* Email Confirmation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Confirmation Email Sent</h3>
                  <p className="text-blue-800 text-sm mb-2">
                    We've sent a confirmation email to <span className="font-semibold">{email}</span>
                  </p>
                  <p className="text-blue-700 text-sm">
                    Please check your inbox and spam folder. If you don't receive it within 5 minutes, please contact us.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-xl font-semibold mb-4">What Happens Next?</h3>
              <ol className="space-y-3">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">1</span>
                  <div>
                    <p className="font-semibold">Application Review</p>
                    <p className="text-sm text-slate-600">Our team will review your application (2-3 business days)</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">2</span>
                  <div>
                    <p className="font-semibold">Interview Invitation</p>
                    <p className="text-sm text-slate-600">If selected, you'll receive interview details via email</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">3</span>
                  <div>
                    <p className="font-semibold">Final Decision</p>
                    <p className="text-sm text-slate-600">You'll be notified of the final decision and start date</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Important Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="font-semibold text-amber-900 mb-3">Important Information</h4>
              <ul className="space-y-2 text-sm text-amber-800">
                <li>✓ Check your email regularly for updates</li>
                <li>✓ Keep your contact information up to date</li>
                <li>✓ Be prepared for an interview call</li>
                <li>✓ Ensure you have all required documents ready</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/student/login" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg flex items-center justify-center gap-2">
                  Access Your Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full py-6 text-lg">
                  Return to Home
                </Button>
              </Link>
            </div>

            {/* Support */}
            <div className="text-center pt-6 border-t border-slate-200">
              <p className="text-slate-600 text-sm mb-3">Have questions?</p>
              <Link href="/contact">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                  Contact Our Support Team
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
