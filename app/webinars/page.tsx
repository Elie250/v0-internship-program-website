'use client'

import { Calendar, Clock, User, Video } from 'lucide-react'
import Link from 'next/link'

export default function WebinarsPage() {
  const webinars = [
    {
      id: 1,
      title: 'Advanced Arduino Programming',
      description: 'Learn advanced techniques in Arduino development for IoT applications',
      date: '2025-03-20',
      time: '14:00 UTC',
      speaker: 'Dr. Ahmed Hassan',
      level: 'Intermediate',
      link: 'https://zoom.us/j/meeting',
    },
    {
      id: 2,
      title: 'IoT with Node-RED',
      description: 'Visual programming for IoT and smart systems',
      date: '2025-03-27',
      time: '15:00 UTC',
      speaker: 'Eng. Fatima Ali',
      level: 'Beginner',
      link: 'https://zoom.us/j/meeting',
    },
    {
      id: 3,
      title: 'PLC Fundamentals',
      description: 'Introduction to Programmable Logic Controllers',
      date: '2025-04-03',
      time: '14:00 UTC',
      speaker: 'Eng. Mohamed Sayed',
      level: 'Beginner',
      link: 'https://zoom.us/j/meeting',
    },
    {
      id: 4,
      title: 'MQTT Protocol Deep Dive',
      description: 'Master MQTT for IoT communications',
      date: '2025-04-10',
      time: '15:30 UTC',
      speaker: 'Dr. Ahmed Hassan',
      level: 'Advanced',
      link: 'https://zoom.us/j/meeting',
    },
  ]

  return (
    <main className="min-h-screen">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Live Webinars</h1>
          <p className="text-xl text-blue-100">Join our expert engineers for live learning sessions</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6">
            {webinars.map((webinar) => (
              <div key={webinar.id} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold mb-2">{webinar.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">{webinar.description}</p>
                    
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
                        <span>{webinar.speaker}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-semibold text-center ${
                      webinar.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                      webinar.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {webinar.level}
                    </span>
                    <Link href={webinar.link} target="_blank" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      <Video className="w-4 h-4" />
                      Join Webinar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
