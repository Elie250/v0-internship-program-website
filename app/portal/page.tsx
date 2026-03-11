'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Zap, Cpu, Wifi, Waves } from 'lucide-react';

const PROGRAMS = [
  {
    id: 'ELT',
    label: 'Electrical Technology',
    icon: Zap,
    description: 'Domestic electricity, industrial installation, PLC automation, and motor control.'
  },
  {
    id: 'CSA',
    label: 'Embedded Systems',
    icon: Cpu,
    description: 'Microcontrollers, embedded programming, and hardware-software integration.'
  },
  {
    id: 'NIT',
    label: 'IoT & Networking',
    icon: Wifi,
    description: 'IoT connectivity, network infrastructure, and communication systems.'
  },
  {
    id: 'ETE',
    label: 'Electronics',
    icon: Waves,
    description: 'Electronic circuits, sensors, and telecommunications.'
  }
];

export default function StudentPortalPage() {
  return (
    <main className="min-h-screen bg-blue-50 text-gray-900 flex flex-col">

      {/* Top Bar with Login */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end">

          <Link href="/login">
            <Button className="text-white bg-blue-600 hover:bg-blue-700">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="text-white bg-blue-600 hover:bg-blue-700">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-64 sm:h-96 bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Welcome to the Student Portal</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Explore our internship programs, gain practical skills, and launch your engineering career with hands-on projects.
          </p>
        </div>
      </section>

      {/* Internship Description */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">About Our Internship Programs</h2>
        <p className="text-gray-700 mb-4 text-center">
          Our internships are designed to give students real-world experience in electrical, electronics, embedded systems, and networking fields.
        </p>
        <p className="text-gray-700 mb-4 text-center">
          Students will work on practical projects guided by industry experts, preparing them for successful careers in engineering and technology.
        </p>
      </section>

      {/* Programs Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our Programs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((program) => {
              const IconComponent = program.icon;
              return (
                <Card key={program.id} className="shadow-md rounded-xl hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-start gap-3 mb-2">
                      <div className="p-3 rounded-lg bg-blue-100">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg font-bold">{program.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700 text-sm">
                      {program.description}
                    </CardDescription>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Link href="/student/login">
                      <Button size="sm" className="w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2">
                        More Information <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-100 text-gray-800 py-12 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p>© 2025 Energy & Logics. All rights reserved.</p>
          <p>Engineering Sustainable Solutions</p>
        </div>
      </footer>

    </main>
  );
}