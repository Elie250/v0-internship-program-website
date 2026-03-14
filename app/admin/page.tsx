'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Cpu, Settings, Wrench, GraduationCap } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex flex-col">

      {/* HERO SECTION */}

      <section className="bg-gray-100 py-20 px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              ENERGY & LOGICS LTD
            </h1>

            <h2 className="text-3xl font-semibold text-blue-600 mb-6">
              Engineering Hub for Automation Systems
            </h2>

            <p className="text-gray-600 text-lg mb-6">
              Energy & Logics provides professional engineering solutions,
              automation training, and industrial consultancy for students,
              engineers, and industries.
            </p>

            <div className="flex gap-4">
              <Link
                href="/programs"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg"
              >
                View Programs
              </Link>

              <Link
                href="/contact"
                className="px-6 py-3 border border-gray-400 rounded-lg"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/engineering.jpg"
              alt="Engineering Hub"
              width={500}
              height={400}
              className="rounded-lg"
            />
          </div>

        </div>
      </section>

      {/* SERVICES */}

      <section className="py-20 px-10">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-bold text-center mb-12">
            Our Engineering Services
          </h2>

          <div className="grid md:grid-cols-4 gap-8">

            {/* TRAININGS */}

            <div className="border rounded-lg p-6 text-center shadow">
              <Cpu className="mx-auto mb-4" size={40} />

              <h3 className="text-xl font-semibold mb-3">
                Trainings
              </h3>

              <p className="text-gray-600">
                PLC Programming, Arduino & Embedded Systems,
                SCADA and Industrial Automation training.
              </p>
            </div>

            {/* WORKSHOPS */}

            <div className="border rounded-lg p-6 text-center shadow">
              <Wrench className="mx-auto mb-4" size={40} />

              <h3 className="text-xl font-semibold mb-3">
                Workshops
              </h3>

              <p className="text-gray-600">
                Hands-on practical workshops in robotics,
                IoT development and smart automation.
              </p>
            </div>

            {/* CONSULTANCY */}

            <div className="border rounded-lg p-6 text-center shadow">
              <Settings className="mx-auto mb-4" size={40} />

              <h3 className="text-xl font-semibold mb-3">
                Engineering Consultancy
              </h3>

              <p className="text-gray-600">
                Industrial automation design, machine control
                systems and technical troubleshooting.
              </p>
            </div>

            {/* STUDENTS */}

            <div className="border rounded-lg p-6 text-center shadow">
              <GraduationCap className="mx-auto mb-4" size={40} />

              <h3 className="text-xl font-semibold mb-3">
                Student Programs
              </h3>

              <p className="text-gray-600">
                Engineering internships, mentorship and
                final year project support.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ENGINEERING HUB */}

      <section className="bg-gray-100 py-20 px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <Image
            src="/automation-lab.jpg"
            alt="Automation Lab"
            width={500}
            height={400}
            className="rounded-lg"
          />

          <div>
            <h2 className="text-3xl font-bold mb-6">
              Our Engineering Hub
            </h2>

            <p className="text-gray-600 mb-4">
              The Energy & Logics Engineering Hub is a practical
              innovation center focused on industrial automation,
              embedded systems, and engineering training.
            </p>

            <p className="text-gray-600 mb-4">
              We provide hands-on learning environments with PLCs,
              Arduino systems, sensors, robotics and automation
              technologies used in modern industries.
            </p>

            <p className="text-gray-600">
              Our mission is to empower engineers and students
              with practical technical skills for the future
              of smart industry.
            </p>

          </div>

        </div>
      </section>

      {/* CONTACT */}

      <section className="py-16 px-10 text-center bg-blue-600 text-white">

        <h2 className="text-3xl font-bold mb-4">
          Contact Energy & Logics
        </h2>

        <p className="mb-2">
          Email: energylogicsltd@gmail.com
        </p>

        <p className="mb-6">
          Phone: +250 783 986 252
        </p>

        <Link
          href="/contact"
          className="px-6 py-3 bg-white text-blue-600 rounded-lg"
        >
          Get in Touch
        </Link>

      </section>

    </main>
  )
}