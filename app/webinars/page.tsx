'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Video } from 'lucide-react'
import Link from 'next/link'

interface Webinar {
  id: string | number
  title: string
  date: string
  time: string
  instructor: string
  capacity: number
  registrations: number
  description?: string
  level?: string
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedWebinars = localStorage.getItem('webinars')
    if (savedWebinars) {
      setWebinars(JSON.parse(savedWebinars))
    } else {
      const defaultWebinars: Webinar[] = [
        {
          id: 1,
          title: 'Advanced Arduino Programming',
          description: 'Learn advanced techniques in Arduino development for IoT applications',
          date: '2025-03-20',
          time: '14:00 UTC',
          instructor: 'Dr. Ahmed Hassan',
          level: 'Intermediate',
          capacity: 50,
          registrations: 28,
        },
        {
          id: 2,
          title: 'IoT with Node-RED',
          description: 'Visual programming for IoT and smart systems',
          date: '2025-03-27',
          time: '15:00 UTC',
          instructor: 'Eng. Fatima Ali',
          level: 'Beginner',
          capacity: 40,
          registrations: 32,
        },
        {
          id: 3,
          title: 'PLC Fundamentals',
          description: 'Introduction to Programmable Logic Controllers',
          date: '2025-04-03',
          time: '14:00 UTC',
          instructor: 'Eng. Mohamed Sayed',
          level: 'Beginner',
          capacity: 35,
          registrations: 28,
        },
      ]
      setWebinars(defaultWebinars)
    }
    setIsLoading(false)
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Live Webinars</h1>
          <p className="text-xl text-blue-100">Join our expert engineers for live learning sessions</p>
        </div>
      </section>

      {/* Webinars List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <p className="text-center text-slate-600">Loading webinars...</p>
          ) : webinars.length === 0 ? (
            <p className="text-center text-slate-600">No webinars scheduled yet. Check back soon!</p>
          ) : (
            <div className="grid gap-6">
              {webinars.map((webinar) => (
                <div
                  key={webinar.id}
                  className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-2xl font-bold mb-2">{webinar.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {webinar.description || 'Join us for an informative session'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>{new Date(webinar.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>{webinar.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>{webinar.instructor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-3">
                      <span className="px-3 py-1 rounded text-sm font-semibold text-center bg-blue-100 text-blue-700">
                        {webinar.registrations}/{webinar.capacity} registered
                      </span>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        <Video className="w-4 h-4" />
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}