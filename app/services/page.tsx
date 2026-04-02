'use client'

import Link from 'next/link'
import { Code2, Zap, Lightbulb, Cpu, Users, Leaf, MessageSquare } from 'lucide-react'

export default function ServicesPage() {
  const services = [
    {
      icon: Code2,
      title: 'Embedded Systems Development',
      description: 'Custom firmware and hardware integration for IoT and industrial applications',
      features: ['Microcontroller programming', 'Real-time systems', 'IoT integration', 'Device drivers'],
    },
    {
      icon: Zap,
      title: 'Industrial Automation',
      description: 'Complete automation solutions with PLC, SCADA, and HMI systems',
      features: ['PLC programming', 'SCADA implementation', 'HMI development', 'System integration'],
    },
    {
      icon: Lightbulb,
      title: 'IoT Solutions',
      description: 'Connected device platforms and cloud integration services',
      features: ['Cloud architecture', 'Edge computing', 'Real-time analytics', 'Mobile apps'],
    },
    {
      icon: Cpu,
      title: 'Engineering Consulting',
      description: 'Technical expertise and guidance for your engineering projects',
      features: ['System design', 'Technical reviews', 'Feasibility studies', 'Optimization'],
    },
    {
      icon: Users,
      title: 'Team Training',
      description: 'Upskill your engineering team with latest technologies',
      features: ['Custom programs', 'Hands-on workshops', 'Certification training', 'Mentorship'],
    },
    {
      icon: Leaf,
      title: 'Renewable Energy Systems',
      description: 'Solar and sustainable energy solutions for homes and businesses',
      features: ['Solar design', 'Energy storage', 'Grid integration', 'Maintenance'],
    },
  ]

  return (
    <main className="min-h-screen">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-blue-100">Comprehensive engineering solutions for your business</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, idx) => {
              const Icon = service.icon
              return (
                <div key={idx} className="p-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                  <Icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{service.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-blue-600">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/contact" className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                    Request Service →
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Service Request Form */}
          <div className="mt-16 p-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-6">Request a Service</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Your Name" className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
                <input type="email" placeholder="Your Email" className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
              </div>
              <input type="text" placeholder="Service Needed" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
              <textarea placeholder="Describe your project" rows={4} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg"></textarea>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
