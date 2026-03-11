'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, MessageCircle, Zap, Cpu, Wifi, Waves, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PROGRAMS = [
  {
    id: 'ELT',
    label: 'Electrical Technology',
    icon: Zap,
    description: 'Domestic electricity, industrial installation, PLC automation, and motor control.',
    image: '/images/program-elt.jpg',
    price: '30,000 Rwf / 1 month'
  },
  {
    id: 'CSA',
    label: 'Embedded Systems',
    icon: Cpu,
    description: 'Microcontrollers, embedded programming, and hardware-software integration.',
    image: '/images/program-csa.jpg',
    price: '30,000 Rwf / 1 month'
  },
  {
    id: 'NIT',
    label: 'IoT & Networking',
    icon: Wifi,
    description: 'IoT connectivity, network infrastructure, and communication systems.',
    image: '/images/program-nit.jpg',
    price: '20,000 Rwf / 2 weeks'
  },
  {
    id: 'ETE',
    label: 'Electronics',
    icon: Waves,
    description: 'Electronic circuits, sensors, and telecommunications.',
    image: '/images/program-ete.jpg',
    price: 'Depends on package'
  }
];

export default function Home() {
  const [isHeroReady] = useState(true);

  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Energy & Logics" width={48} height={48} className="w-12 h-12" />
            <div>
              <p className="font-bold text-primary text-lg">Energy & Logics</p>
              <p className="text-xs text-muted-foreground">Engineering Academy</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/portal"><Button>Student Portal</Button></Link>
            <Link href="/programs"><Button variant="ghost">Programs</Button></Link>
            <Link href="/contact"><Button variant="ghost">Contact</Button></Link>
            <Link href="/admin/login"><Button variant="outline">Admin</Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full h-[85vh] md:h-[90vh]">
        <Image
          src="/hero-electrical.jpg"
          alt="Hero Banner"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-6">
            Build Your Future in Engineering
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl drop-shadow-md">
            Hands-on internship programs in Electrical Systems, Embedded Technology, IoT & Networking, and Electronics, guided by industry experts.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply">
              <Button className="bg-primary px-8 py-4 text-lg font-semibold shadow-lg hover:bg-primary/90 flex items-center gap-2">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="https://wa.me/250783986252" target="_blank">
              <Button variant="outline" className="px-8 py-4 text-lg border-primary text-primary hover:bg-primary/10 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* PROGRAMS GRID */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Internship Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Specialized internship tracks designed to develop practical skills in modern engineering disciplines.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROGRAMS.map((program) => {
              const IconComponent = program.icon;
              return (
                <Card key={program.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative w-full h-48">
                    <Image
                      src={program.image}
                      alt={program.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{program.label}</CardTitle>
                    </div>
                    <p className="text-xl font-bold text-primary">{program.price}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Link href={`/programs/${program.id}`}>
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                        Learn More <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
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
                Join our comprehensive internship programs to gain real-world experience and practical skills guided by industry experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply" className="flex-1">
                  <Button className="w-full px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                    Apply Now <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="https://wa.me/250783986252" target="_blank" className="flex-1">
                  <Button variant="outline" className="w-full px-8 py-4 text-lg border-primary text-primary hover:bg-primary/10">
                    <MessageCircle className="mr-2 w-5 h-5" /> Get More Info
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Phone</h3>
            <p className="text-primary-foreground/90">+250 783 986 252</p>
          </div>
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Email</h3>
            <p className="text-primary-foreground/90">energylogicsltd@gmail.com</p>
          </div>
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Location</h3>
            <p className="text-primary-foreground/90">Nyamirambo, Kigali, Rwanda</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-secondary text-secondary-foreground border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <Image src="/logo.png" alt="Energy & Logics" width={48} height={48} className="w-12 h-12" />
            <div>
              <p className="font-bold">Energy & Logics</p>
              <p className="text-xs text-secondary-foreground/70">Engineering Academy</p>
            </div>
          </div>
          <p className="text-sm text-secondary-foreground/70">© 2025 Energy & Logics. All rights reserved.</p>
        </div>
        <div className="border-t border-secondary-foreground/20 pt-4 text-center text-sm text-secondary-foreground/70">
          Engineering Sustainable Solutions
        </div>
      </footer>

    </main>
  );
}