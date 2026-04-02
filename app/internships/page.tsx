'use client'

import Link from 'next/link'
import { Briefcase, MapPin, Clock, ChevronRight } from 'lucide-react'

export default function InternshipsPage() {
  const internships = [
    {
      id: 1,
      title: 'Embedded Systems Intern',
      department: 'R&D',
      duration: '3-6 months',
      location: 'Kigali, Rwanda',
      level: 'Intermediate',
      description: 'Develop firmware for IoT devices and microcontroller projects',
      benefits: ['Competitive stipend', 'Mentorship', 'Training materials', 'Certificate'],
    },
    {
      id: 2,
      title: 'Automation Engineering Intern',
      department: 'Industrial Solutions',
      duration: '3-6 months',
      location: 'Kigali, Rwanda',
      level: 'Beginner',
      description: 'Work on PLC programming and industrial automation projects',
      benefits: ['Monthly stipend', 'Expert guidance', 'Real projects', 'Job opportunity'],
    },
    {
      id: 3,
      title: 'IoT Solutions Intern',
      department: 'IoT Division',
      duration: '4-6 months',
      location: 'Kigali, Rwanda',
      level: 'Intermediate',
      description: 'Develop IoT applications using cloud platforms and edge computing',
      benefits: ['Stipend + bonus', 'Tech stack training', 'Portfolio building', 'Network'],
    },
  ]

  return (
    <main className="min-h-screen">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Internship Opportunities</h1>
          <p className="text-xl text-blue-100">Launch your engineering career with hands-on experience</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">
            {internships.map((internship) => (
              <div key={internship.id} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{internship.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">{internship.description}</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>{internship.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{internship.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{internship.location}</span>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      internship.level === 'Beginner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {internship.level}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold mb-2">Benefits</h4>
                      <ul className="text-sm space-y-1">
                        {internship.benefits.map((benefit, i) => (
                          <li key={i} className="text-slate-600 dark:text-slate-400">• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      Apply Now
                      <ChevronRight className="w-4 h-4" />
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
