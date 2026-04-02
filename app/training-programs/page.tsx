'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, Users, Certificate } from 'lucide-react'

export default function TrainingPage() {
  const programs = [
    {
      id: 1,
      title: 'Embedded Systems Bootcamp',
      duration: '12 Weeks',
      level: 'Intermediate',
      price: '$2,499',
      students: 45,
      description: 'Master embedded systems development with C/C++ and microcontroller programming.',
      modules: ['C/C++ Fundamentals', 'Microcontrollers', 'Real-time Systems', 'IoT Projects', 'Testing & Debugging'],
    },
    {
      id: 2,
      title: 'Industrial Automation',
      duration: '8 Weeks',
      level: 'Beginner',
      price: '$1,999',
      students: 32,
      description: 'Learn PLC programming and SCADA systems for industrial applications.',
      modules: ['PLC Basics', 'Ladder Logic', 'SCADA Systems', 'HMI Development', 'Real Projects'],
    },
    {
      id: 3,
      title: 'IoT Development',
      duration: '10 Weeks',
      level: 'Intermediate',
      price: '$2,299',
      students: 38,
      description: 'Build connected IoT solutions using cloud platforms and microservices.',
      modules: ['MQTT & CoAP', 'Cloud APIs', 'Edge Computing', 'Security', 'Deployment'],
    },
    {
      id: 4,
      title: 'Advanced PLC & Networking',
      duration: '6 Weeks',
      level: 'Advanced',
      price: '$1,799',
      students: 28,
      description: 'Advanced topics in industrial control systems and network integration.',
      modules: ['Advanced PLC', 'Networking', 'Cybersecurity', 'Industry 4.0', 'Case Studies'],
    },
  ]

  return (
    <main className="min-h-screen">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Training Programs</h1>
          <p className="text-xl text-blue-100">Choose from our comprehensive engineering courses</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program) => (
              <div key={program.id} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition flex flex-col">
                <h3 className="text-2xl font-bold mb-2">{program.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 flex-grow">{program.description}</p>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{program.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{program.students} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Certificate className="w-4 h-4 text-blue-600" />
                    <span>{program.level}</span>
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-2xl text-blue-600">{program.price}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {program.modules.map((module, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{module}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/contact" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center">
                  Enroll Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
