'use client'

import Link from 'next/link'
import { BookOpen, FileText, Trophy, Bell, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const userInfo = {
    name: 'John Doe',
    email: 'john@example.com',
    registrations: 3,
    certificates: 1,
    internshipStatus: 'In Progress',
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <section className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{userInfo.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">{userInfo.email}</p>
          </div>
          <Link href="/login" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{userInfo.registrations}</p>
            <p className="text-slate-600 dark:text-slate-400">Webinars Registered</p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">2</p>
            <p className="text-slate-600 dark:text-slate-400">Trainings Enrolled</p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-2xl font-bold">{userInfo.certificates}</p>
            <p className="text-slate-600 dark:text-slate-400">Certificates Earned</p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Bell className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{userInfo.internshipStatus === 'In Progress' ? '✓' : '○'}</p>
            <p className="text-slate-600 dark:text-slate-400">Internship: {userInfo.internshipStatus}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/webinars" className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">Browse Webinars</h3>
              <p className="text-slate-600 dark:text-slate-400">View upcoming webinars and register</p>
            </Link>
            <Link href="/training-programs" className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">Training Programs</h3>
              <p className="text-slate-600 dark:text-slate-400">Enroll in professional training courses</p>
            </Link>
            <Link href="/internships" className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">Apply for Internship</h3>
              <p className="text-slate-600 dark:text-slate-400">Submit your application to our programs</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-4 p-6">
              <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <p className="font-semibold">Completed: Arduino Basics Certificate</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">2 days ago</p>
              </div>
              <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <p className="font-semibold">Registered for: IoT Development Webinar</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">1 week ago</p>
              </div>
              <div>
                <p className="font-semibold">Started: Industrial Automation Training</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">2 weeks ago</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
