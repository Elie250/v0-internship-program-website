'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Code2, Zap, Cpu, Lightbulb, Users, CheckCircle2, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Ahmed Hassan',
    role: 'Software Engineer',
    content: 'The internship program transformed my career. Highly recommend Energy & Logics!',
  },
  {
    name: 'Farah Mohamed',
    role: 'IoT Developer',
    content: 'Best training I received. Professional mentors and real-world projects.',
  },
  {
    name: 'John Mwangi',
    role: 'Automation Specialist',
    content: 'The services team delivered exceptional solutions for our company.',
  },
]

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-sm text-blue-200">Welcome to Engineering Excellence</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-balance leading-tight">
                Energy & Logics Engineering Hub
              </h1>

              <p className="text-xl text-slate-300 mb-8 text-pretty">
                Transform your career with cutting-edge training in embedded systems, automation, IoT, and industrial engineering. Industry-expert mentorship and real-world projects.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/internships"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Apply for Internship
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/webinars"
                  className="inline-flex items-center justify-center px-6 py-3 border border-slate-500 text-slate-200 rounded-lg font-semibold hover:bg-slate-700 transition"
                >
                  Join Webinars
                </Link>
              </div>

              <div className="flex gap-8 mt-12 pt-8 border-t border-slate-700">
                <div>
                  <p className="text-3xl font-bold text-blue-400">500+</p>
                  <p className="text-slate-400">Students Trained</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-400">95%</p>
                  <p className="text-slate-400">Success Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-400">50+</p>
                  <p className="text-slate-400">Companies</p>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 backdrop-blur-sm border border-blue-400/20">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Cpu className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Embedded Systems</h3>
                      <p className="text-sm text-slate-400">Master microcontrollers & firmware</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Zap className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Industrial Automation</h3>
                      <p className="text-sm text-slate-400">PLC & SCADA programming</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Lightbulb className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">IoT Solutions</h3>
                      <p className="text-sm text-slate-400">Connected systems development</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Comprehensive engineering solutions for every need</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Code2, title: 'Embedded Development', description: 'Custom firmware and hardware integration' },
              { icon: Zap, title: 'Industrial Automation', description: 'PLC programming and system design' },
              { icon: Lightbulb, title: 'IoT Solutions', description: 'Connected devices and cloud integration' },
              { icon: Cpu, title: 'Engineering Consulting', description: 'Technical expertise for your projects' },
              { icon: Users, title: 'Team Training', description: 'Upskill your engineering team' },
              { icon: Wrench, title: 'Renewable Energy', description: 'Solar and sustainable solutions' },
            ].map((service, idx) => {
              const Icon = service.icon
              return (
                <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                  <Icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{service.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Upcoming Webinars</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Advanced Arduino Programming', date: 'Mar 20, 2025', speaker: 'Dr. Ahmed Hassan' },
              { title: 'IoT with Node-RED', date: 'Mar 27, 2025', speaker: 'Eng. Fatima Ali' },
              { title: 'PLC Fundamentals', date: 'Apr 3, 2025', speaker: 'Eng. Mohamed Sayed' },
            ].map((webinar, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
                <h3 className="font-semibold text-lg mb-2">{webinar.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{webinar.date}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Speaker: {webinar.speaker}</p>
                <Link href="/webinars" className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                  Register Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Programs */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Training Programs</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Embedded Systems Bootcamp',
                duration: '12 Weeks',
                level: 'Intermediate',
                features: ['C/C++ Programming', 'Microcontrollers', 'Real-time systems', 'IoT projects'],
              },
              {
                title: 'Industrial Automation',
                duration: '8 Weeks',
                level: 'Beginner',
                features: ['PLC Programming', 'SCADA Systems', 'Ladder Logic', 'Real projects'],
              },
              {
                title: 'IoT Development',
                duration: '10 Weeks',
                level: 'Intermediate',
                features: ['MQTT/CoAP', 'Cloud APIs', 'Edge Computing', 'Security'],
              },
              {
                title: 'Advanced Automation',
                duration: '6 Weeks',
                level: 'Advanced',
                features: ['Advanced PLC', 'Networking', 'Cybersecurity', 'Industry 4.0'],
              },
            ].map((prog, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-2">{prog.title}</h3>
                <div className="flex gap-4 mb-4 text-sm">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">{prog.duration}</span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">{prog.level}</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {prog.features.map((feat, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/training-programs" className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">Join hundreds of engineers who transformed their careers with Energy & Logics</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Get in Touch
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  )
}
