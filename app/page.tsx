'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, MessageCircle, Zap, Cpu, Wifi, Radio, User, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PROGRAMS = [
  {
    id: 'ELEC',
    label: 'Electrical Engineering',
    icon: Zap,
    description: 'Power systems, industrial automation, motor control, PLC programming.',
    image: '/images/program-elec.jpg',
  },
  {
    id: 'EMBED',
    label: 'Embedded Systems',
    icon: Cpu,
    description: 'Microcontrollers, hardware-software integration, robotics.',
    image: '/images/program-embedded.jpg',
  },
  {
    id: 'IOT',
    label: 'IoT & Networking',
    icon: Wifi,
    description: 'IoT solutions, network infrastructure, connectivity, communication systems.',
    image: '/images/program-iot.jpg',
  },
  {
    id: 'ELEC2',
    label: 'Electronics',
    icon: Radio,
    description: 'Circuit design, sensors, telecommunications, and electronics projects.',
    image: '/images/program-electronics.jpg',
  },
  {
    id: 'MECH',
    label: 'Mechanical Engineering',
    icon: Gear,
    description: 'Mechanical design, CAD, manufacturing processes, robotics.',
    image: '/images/program-mech.jpg',
  },
  {
    id: 'CIV',
    label: 'Civil Engineering',
    icon: Build,
    description: 'Construction design, structural analysis, sustainable building projects.',
    image: '/images/program-civil.jpg',
  },
  {
    id: 'IND',
    label: 'Individual Training',
    icon: User,
    description: 'Personalized one-on-one engineering training adapted to your project and pace.',
    image: '/images/program-individual.jpg',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Engineering Hub" width={45} height={45} />
            <div>
              <p className="font-bold text-lg text-blue-700">Engineering Hub</p>
              <p className="text-xs text-gray-500">Your Gateway to Industry Skills</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/portal"><Button>Student Portal</Button></Link>
            <Link href="/programs"><Button variant="ghost">Programs</Button></Link>
            <Link href="/contact"><Button variant="ghost">Contact</Button></Link>
            <Link href="/admin/login"><Button variant="outline">Admin</Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative h-[85vh] flex items-center justify-center">
        <Image src="/hero-engineering.jpg" alt="Engineering training" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative text-center text-white px-6 max-w-3xl">
          <h1 className="text-5xl font-bold mb-6 leading-tight">Empower Your Career Across All Engineering Disciplines</h1>
          <p className="text-lg mb-8 text-gray-200">
            Hands-on internship programs and professional training across Electrical, Electronics, Mechanical, Civil, Embedded, and IoT fields.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/apply">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg">
                Apply Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="https://wa.me/250783986252" target="_blank">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg">
                <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>
      {/* PROGRAMS */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Engineering Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional programs designed to build practical engineering skills across multiple sectors.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PROGRAMS.map((program) => {
              const Icon = program.icon;
              return (
                <Card key={program.id} className="hover:shadow-xl transition overflow-hidden">
                  <Image src={program.image} alt={program.label} width={500} height={250} className="w-full h-48 object-cover" />
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <CardTitle>{program.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                    <Link href={`/programs/${program.id}`}>
                      <Button variant="outline" className="w-full">Learn More</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRAINING FEES */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Training Fees</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-blue-500 border-2 shadow-lg">
              <CardHeader><CardTitle className="text-xl">Engineering Internship</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600 mb-4">30,000 RWF</p>
                <p className="text-gray-600">1 Month Program</p>
              </CardContent>
            </Card>
            <Card className="border-green-500 border-2 shadow-lg">
              <CardHeader><CardTitle className="text-xl">Short Intensive Training</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600 mb-4">20,000 RWF</p>
                <p className="text-gray-600">2 Weeks Program</p>
              </CardContent>
            </Card>
            <Card className="border-purple-500 border-2 shadow-lg">
              <CardHeader><CardTitle className="text-xl">Individual Training</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-purple-600 mb-4">Custom Price</p>
                <p className="text-gray-600">Based on project and training needs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Engineering Journey?</h2>
          <p className="text-gray-600 mb-8">Join our hub and gain hands-on experience in the engineering sector you want to master.</p>
          <Link href="/apply">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg shadow-lg">Apply Now</Button>
          </Link>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-blue-700 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <div><Phone className="mx-auto mb-4" /><h3 className="font-semibold mb-2">Phone</h3><p>+250 783 986 252</p></div>
          <div><Mail className="mx-auto mb-4" /><h3 className="font-semibold mb-2">Email</h3><p>energylogicsltd@gmail.com</p></div>
          <div><MapPin className="mx-auto mb-4" /><h3 className="font-semibold mb-2">Location</h3><p>Nyamirambo, Kigali, Rwanda</p></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t">
        © 2026 Engineering Hub — Bridging Skills with Industry
      </footer>

    </main>
  );
}