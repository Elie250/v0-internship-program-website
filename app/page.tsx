'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, MessageCircle, Zap, Cpu, Wifi, Waves, User, Settings, Building, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroSection } from '@/components/hero-section';

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
    icon: Waves,
    description: 'Circuit design, sensors, telecommunications, and electronics projects.',
    image: '/images/program-electronics.jpg',
  },
  {
    id: 'MECH',
    label: 'Mechanical Engineering',
    icon: Settings,
    description: 'Mechanical design, CAD, manufacturing processes, robotics.',
    image: '/images/program-mech.jpg',
  },
  {
    id: 'CIV',
    label: 'Civil Engineering',
    icon: Building,
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
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Energy & Logics" width={45} height={45} />
            <div>
              <p className="font-bold text-lg text-primary">Energy & Logics</p>
              <p className="text-xs text-muted-foreground">Engineering Academy</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Link href="/auth/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/auth/register"><Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">Join Academy</Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION WITH DYNAMIC CONTENT */}
      <HeroSection />

      {/* PROGRAMS SECTION */}
      <section className="py-20 bg-muted/30 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Our Engineering Programs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional programs designed to build practical engineering skills across multiple sectors.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PROGRAMS.map((program) => {
              const Icon = program.icon;
              return (
                <Card key={program.id} className="hover:shadow-xl transition overflow-hidden border-border hover:border-primary/50">
                  <Image src={program.image} alt={program.label} width={500} height={250} className="w-full h-48 object-cover" />
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{program.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{program.description}</p>
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

      {/* FEATURES SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide industry-leading training with hands-on experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Expert Instructors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Learn from industry professionals with years of hands-on experience in their fields.</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Hands-On Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Work with real equipment and tools used in professional engineering environments.</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Career Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Get help with job placement and career guidance after completing your training.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Get in Touch</h2>
          <p className="text-lg mb-8 opacity-90">
            Ready to start your engineering journey? Contact us today to learn more about our programs.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <Phone className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold">Phone</p>
              <a href="tel:+250783986252" className="hover:underline">+250 783 986 252</a>
            </div>
            <div>
              <Mail className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold">Email</p>
              <a href="mailto:info@energyandlogics.com" className="hover:underline">info@energyandlogics.com</a>
            </div>
            <div>
              <MapPin className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold">Location</p>
              <p>Kigali, Rwanda</p>
            </div>
          </div>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg text-primary mb-4">Energy & Logics</h3>
              <p className="text-muted-foreground text-sm">Professional engineering training academy.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/login" className="hover:text-primary">Login</Link></li>
                <li><Link href="/auth/register" className="hover:text-primary">Register</Link></li>
                <li><Link href="/" className="hover:text-primary">Programs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="tel:+250783986252" className="hover:text-primary">+250 783 986 252</a></li>
                <li><a href="mailto:info@energyandlogics.com" className="hover:text-primary">info@energyandlogics.com</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Twitter</a></li>
                <li><a href="#" className="hover:text-primary">LinkedIn</a></li>
                <li><a href="#" className="hover:text-primary">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Energy & Logics Engineering Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
