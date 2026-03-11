'use client';

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PROGRAMS = [
  {
    id: 'ELT',
    label: 'Electrical Technology',
    image: '/programs/electrical.jpg',
    description: 'Domestic electricity, industrial installation, PLC automation and motor control.'
  },
  {
    id: 'CSA',
    label: 'Computer System & Architecture',
    image: '/programs/computer.jpg',
    description: 'Embedded systems, microcontrollers, and hardware-software integration.'
  },
  {
    id: 'NIT',
    label: 'Networking & Internet Technology',
    image: '/programs/network.jpg',
    description: 'Network infrastructure, IoT connectivity, routers and communication systems.'
  },
  {
    id: 'ETE',
    label: 'Electronics & Telecommunication',
    image: '/programs/electronics.jpg',
    description: 'Electronic circuits, sensors, telecommunications and signal processing.'
  }
]

export default function Home() {

  const [formData, setFormData] = useState({
    registrationType: 'Student',
    fullName: '',
    email: '',
    phone: '',
    school: '',
    program: '',
    level: '',
    duration: '',
    profession: '',
    trainingProgram: '',
    schedule: '',
    message: ''
  })

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (

    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* NAVBAR */}

      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">

          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Energy & Logics" width={40} height={40} />
            <div>
              <p className="font-bold text-blue-800">Energy & Logics</p>
              <p className="text-xs text-gray-500">Engineering Sustainable Solutions</p>
            </div>
          </div>

          <Link href="/admin/login">
            <Button variant="outline">Admin</Button>
          </Link>

        </div>
      </nav>


      {/* HERO */}

      <section className="relative h-screen flex items-center justify-center text-center">

        <Image
          src="/hero.jpg"
          alt="Engineering"
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 max-w-3xl text-white px-6">

          <h1 className="text-5xl font-bold mb-6">
            Transform Your Engineering Career
          </h1>

          <p className="text-lg mb-8">
            Hands-on internship programs in Electrical Systems, PLC Automation,
            Embedded Systems, IoT and Telecommunications.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">

            <a href="#registration-form">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white px-8">
                Start Your Journey
              </Button>
            </a>

            <a href="https://wa.me/250783986252">
              <Button variant="outline" className="text-white border-white">
                <MessageCircle className="mr-2" /> WhatsApp
              </Button>
            </a>

          </div>

        </div>
      </section>


      {/* PROGRAMS */}

      <section className="py-20 px-4">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold text-center mb-12">
            Our Internship Programs
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10">

            {PROGRAMS.map((p) => (
              <Card key={p.id} className="overflow-hidden shadow-md hover:shadow-xl transition">

                <div className="relative h-52">
                  <Image
                    src={p.image}
                    alt={p.label}
                    fill
                    className="object-cover"
                  />
                </div>

                <CardHeader>
                  <CardTitle>{p.label}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600">
                    {p.description}
                  </p>
                </CardContent>

              </Card>
            ))}

          </div>

        </div>

      </section>


      {/* REGISTRATION FORM */}

      <section id="registration-form" className="py-20 px-4 bg-white">

        <div className="max-w-3xl mx-auto">

          <h2 className="text-4xl font-bold text-center mb-10">
            Register for Internship
          </h2>

          <Card>

            <CardContent className="space-y-6 pt-6">

              <div>

                <Label>Full Name</Label>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} />

              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <Label>Email</Label>
                  <Input name="email" value={formData.email} onChange={handleInputChange} />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>

              </div>

              <div>

                <Label>School</Label>
                <Input name="school" value={formData.school} onChange={handleInputChange} />

              </div>

              <div>

                <Label>Program</Label>

                <Select onValueChange={(v) => handleSelectChange('program', v)}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>

                  <SelectContent>

                    {PROGRAMS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div>

                <Label>Message</Label>

                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                />

              </div>

              <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                Submit Registration
              </Button>

            </CardContent>

          </Card>

        </div>

      </section>


      {/* CONTACT */}

      <section className="bg-blue-900 text-white py-20 px-4">

        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-4xl font-bold mb-12">Contact Us</h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div>
              <Phone className="mx-auto mb-3" />
              <p>+250 783 986 252</p>
            </div>

            <div>
              <Mail className="mx-auto mb-3" />
              <p>energylogicsltd@gmail.com</p>
            </div>

            <div>
              <MapPin className="mx-auto mb-3" />
              <p>Nyamirambo, Kigali</p>
            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="bg-gray-900 text-gray-400 text-center py-6">

        <p>
          © 2025 Energy & Logics. All rights reserved.
        </p>

        <p className="text-sm mt-1">
          Engineering Sustainable Solutions
        </p>

      </footer>

    </main>

  )
}