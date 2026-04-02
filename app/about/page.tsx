'use client'

import { Users, Wrench, Award, Target, Zap } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">About Energy & Logics</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl">
            Founded in 2015, Energy & Logics Ltd is a leading engineering training and consulting company based in East Africa, specializing in embedded systems, industrial automation, and IoT solutions.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                To empower engineers and companies with cutting-edge technical knowledge and practical skills in embedded systems, automation, and IoT technologies.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                We believe in learning by doing, combining theoretical knowledge with real-world projects and mentorship from industry experts.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 dark:bg-slate-800 rounded-lg">
                <Target className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Vision</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Become Africa's leading engineering hub</p>
              </div>
              <div className="p-6 bg-green-50 dark:bg-slate-800 rounded-lg">
                <Award className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">Quality</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Industry-standard training programs</p>
              </div>
              <div className="p-6 bg-purple-50 dark:bg-slate-800 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Strong alumni network</p>
              </div>
              <div className="p-6 bg-amber-50 dark:bg-slate-800 rounded-lg">
                <Zap className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Latest technologies & methods</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Team</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Dr. Ahmed Hassan', role: 'Founder & CEO', expertise: 'Embedded Systems' },
              { name: 'Eng. Fatima Ali', role: 'Training Director', expertise: 'IoT Solutions' },
              { name: 'Eng. Mohamed Sayed', role: 'Technical Lead', expertise: 'Automation' },
              { name: 'Eng. Aisha Khan', role: 'Business Manager', expertise: 'Operations' },
            ].map((member, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{member.role}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{member.expertise}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
