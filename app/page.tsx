'use client';

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, MessageCircle, Zap, Cpu, Wifi, Waveform, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PROGRAMS = [
  {
    id: 'ELT',
    label: 'Electrical Technology',
    icon: Zap,
    description: 'Domestic electricity, industrial installation, PLC automation and motor control.'
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
    icon: Waveform,
    description: 'Electronic circuits, sensors, and telecommunications.'
  }
]

export default function Home() {
  const [isHeroReady] = useState(true)

  return (

    <main className="min-h-screen bg-background text-foreground">

      {/* NAVBAR */}

      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              EL
            </div>
            <div>
              <p className="font-bold text-primary">Energy & Logics</p>
              <p className="text-xs text-muted-foreground">Engineering Academy</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/programs">
              <Button variant="ghost">Programs</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact</Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline">Admin</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-20">
          <div className="mb-6 inline-block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              <span className="text-sm font-medium text-accent">Welcome to Engineering Excellence</span>
            </div>
          </div>

          <h1 className="text-6xl font-bold mb-6 text-foreground leading-tight text-balance">
            Build Your Future in Engineering
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Master electrical systems, embedded technology, IoT solutions, and electronics through hands-on internship programs designed by industry experts.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/apply">
              <Button className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Your Application <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <a href="https://wa.me/250783986252" target="_blank">
              <Button variant="outline" className="px-8 py-6 text-lg border-primary text-primary hover:bg-primary/10">
                <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>


      {/* PROGRAMS */}

      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Engineering Programs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our specialized internship tracks designed to develop practical skills in modern engineering disciplines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((program) => {
              const IconComponent = program.icon
              return (
                <Card key={program.id} className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{program.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {program.description}
                    </p>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Link href={`/programs/${program.id}`}>
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 group-hover:bg-primary/10">
                        Learn More <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>


      {/* CTA SECTION */}

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl">Ready to Start Your Journey?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Our comprehensive internship programs are designed to equip you with practical skills and industry experience. Join hundreds of graduates who have successfully launched their engineering careers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply" className="flex-1">
                  <Button className="w-full px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                    Apply Now <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="https://wa.me/250783986252" target="_blank" className="flex-1">
                  <Button variant="outline" className="w-full px-8 py-6 text-lg border-primary text-primary hover:bg-primary/10">
                    <MessageCircle className="mr-2 w-5 h-5" /> Get More Info
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* CONTACT */}

      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-primary-foreground/90">
              Have questions? Our team is ready to help you start your engineering journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Phone</h3>
              <p className="text-primary-foreground/90">+250 783 986 252</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-primary-foreground/90">energylogicsltd@gmail.com</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Location</h3>
              <p className="text-primary-foreground/90">Nyamirambo, Kigali, Rwanda</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="bg-secondary text-secondary-foreground border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-secondary font-bold">
                EL
              </div>
              <div>
                <p className="font-bold">Energy & Logics</p>
                <p className="text-xs text-secondary-foreground/70">Engineering Academy</p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              © 2025 Energy & Logics. All rights reserved.
            </p>
          </div>
          <div className="border-t border-secondary-foreground/20 pt-4 text-center text-sm text-secondary-foreground/70">
            <p>Engineering Sustainable Solutions</p>
          </div>
        </div>
      </footer>

    </main>

  )
}
