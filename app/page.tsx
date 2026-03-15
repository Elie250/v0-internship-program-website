'use client'

import Image from "next/image"
import Link from "next/link"
import { Cpu, Wrench, Settings, GraduationCap, Bot, Network } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex flex-col">

      {/* HERO SECTION */}

      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          <div>
            <h1 className="text-5xl font-bold mb-4">
              Energy & Logics Ltd
            </h1>

            <h2 className="text-3xl font-semibold mb-6">
              Engineering Hub for Automation & Embedded Systems
            </h2>

            <p className="text-lg text-blue-100 mb-8">
              We provide professional engineering training, industrial automation
              solutions, and embedded system development for students,
              engineers and companies.
            </p>

            <div className="flex gap-4">
              <Link
                href="/programs"
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold"
              >
                Explore Trainings
              </Link>

              <Link
                href="/contact"
                className="border border-white px-6 py-3 rounded-lg"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/images/automation-lab.jpg"
              alt="Engineering Hub"
              width={520}
              height={420}
              className="rounded-xl shadow-xl"
            />
          </div>

        </div>
      </section>

      {/* SERVICES */}

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-bold text-center mb-14">
            Our Engineering Services
          </h2>

          <div className="grid md:grid-cols-4 gap-10">

            <div className="p-6 border rounded-xl text-center hover:shadow-lg transition">
              <Cpu size={40} className="mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-3">Technical Trainings</h3>
              <p className="text-gray-600">
                PLC programming, SCADA systems, Arduino development and
                industrial automation training programs.
              </p>
            </div>

            <div className="p-6 border rounded-xl text-center hover:shadow-lg transition">
              <Wrench size={40} className="mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-3">Hands-on Workshops</h3>
              <p className="text-gray-600">
                Practical engineering workshops focused on robotics,
                IoT systems and industrial control technologies.
              </p>
            </div>

            <div className="p-6 border rounded-xl text-center hover:shadow-lg transition">
              <Settings size={40} className="mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-3">Engineering Consultancy</h3>
              <p className="text-gray-600">
                Automation system design, machine control integration,
                and industrial troubleshooting services.
              </p>
            </div>

            <div className="p-6 border rounded-xl text-center hover:shadow-lg transition">
              <GraduationCap size={40} className="mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-3">Student Programs</h3>
              <p className="text-gray-600">
                Engineering internships, mentorship programs and final
                year project technical support.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* TECHNOLOGIES */}

      <section className="bg-gray-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-bold text-center mb-14">
            Technologies We Work With
          </h2>

          <div className="grid md:grid-cols-4 gap-10 text-center">

            <div>
              <Cpu size={40} className="mx-auto mb-3 text-blue-700" />
              <h3 className="font-semibold">PLC Systems</h3>
              <p className="text-gray-600 text-sm">
                Industrial PLC programming and automation control.
              </p>
            </div>

            <div>
              <Bot size={40} className="mx-auto mb-3 text-blue-700" />
              <h3 className="font-semibold">Robotics</h3>
              <p className="text-gray-600 text-sm">
                Automation robotics and smart manufacturing systems.
              </p>
            </div>

            <div>
              <Network size={40} className="mx-auto mb-3 text-blue-700" />
              <h3 className="font-semibold">IoT Systems</h3>
              <p className="text-gray-600 text-sm">
                Smart devices, sensors and connected technologies.
              </p>
            </div>

            <div>
              <Settings size={40} className="mx-auto mb-3 text-blue-700" />
              <h3 className="font-semibold">Embedded Systems</h3>
              <p className="text-gray-600 text-sm">
                Arduino and microcontroller-based system development.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* HUB DESCRIPTION */}

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          <Image
            src="/images/plc-training.jpg"
            alt="PLC Training"
            width={520}
            height={420}
            className="rounded-xl shadow-lg"
          />

          <div>
            <h2 className="text-3xl font-bold mb-6">
              Engineering Innovation Hub
            </h2>

            <p className="text-gray-600 mb-4">
              Energy & Logics Engineering Hub is designed to bridge the gap
              between theoretical engineering education and real industrial
              automation systems.
            </p>

            <p className="text-gray-600 mb-4">
              Our hub offers a modern learning environment equipped with
              automation systems, PLC controllers, embedded platforms,
              sensors and industrial communication technologies.
            </p>

            <p className="text-gray-600">
              We aim to empower engineers and students with practical skills
              required for the future of Industry 4.0.
            </p>
          </div>

        </div>
      </section>

      {/* CONTACT */}

      <section className="bg-blue-800 text-white py-16 text-center px-6">

        <h2 className="text-3xl font-bold mb-4">
          Get In Touch
        </h2>

        <p className="mb-2">
          Email: energylogicsltd@gmail.com
        </p>

        <p className="mb-6">
          Phone: +250 783 986 252
        </p>

        <Link
          href="/contact"
          className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold"
        >
          Contact Energy & Logics
        </Link>

      </section>

    </main>
  )
}