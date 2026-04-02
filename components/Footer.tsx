'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Energy & Logics</h3>
            <p className="text-slate-400 text-sm mb-4">Engineering Sustainable Solutions</p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+250 783 986 252</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>energylogicsltd@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Nyamirambo, Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-blue-400 transition">Home</Link></li>
              <li><Link href="/about" className="hover:text-blue-400 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition">Contact</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-400 transition">Dashboard</Link></li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-semibold mb-4">Programs</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/webinars" className="hover:text-blue-400 transition">Webinars</Link></li>
              <li><Link href="/training-programs" className="hover:text-blue-400 transition">Training</Link></li>
              <li><Link href="/internships" className="hover:text-blue-400 transition">Internships</Link></li>
              <li><Link href="/services" className="hover:text-blue-400 transition">Services</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/projects" className="hover:text-blue-400 transition">Projects</Link></li>
              <li><Link href="/blog" className="hover:text-blue-400 transition">Blog</Link></li>
              <li><Link href="/admin/login" className="hover:text-amber-400 transition">Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex gap-4 mb-4 md:mb-0">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            <p className="text-slate-400 text-sm">
              © 2025 Energy & Logics Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
