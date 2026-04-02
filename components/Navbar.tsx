'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Image
              src="/logo.png"
              alt="Energy & Logics"
              width={50}
              height={50}
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold hidden sm:inline">Energy & Logics</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-8">
            <Link href="/" className="hover:text-blue-400 transition text-sm">Home</Link>
            <Link href="/webinars" className="hover:text-blue-400 transition text-sm">Webinars</Link>
            <Link href="/training-programs" className="hover:text-blue-400 transition text-sm">Training</Link>
            <Link href="/internships" className="hover:text-blue-400 transition text-sm">Internships</Link>
            <Link href="/services" className="hover:text-blue-400 transition text-sm">Services</Link>
            <Link href="/projects" className="hover:text-blue-400 transition text-sm">Projects</Link>
            <Link href="/blog" className="hover:text-blue-400 transition text-sm">Blog</Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <Link
              href="/admin/login"
              className="px-4 py-2 border border-amber-500 text-amber-400 hover:bg-amber-500/10 rounded-lg font-semibold transition text-sm"
            >
              Admin
            </Link>
            <Link
              href="/internships"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex flex-wrap gap-2 pb-4">
          <Link href="/" className="text-xs hover:text-blue-400 transition">Home</Link>
          <Link href="/webinars" className="text-xs hover:text-blue-400 transition">Webinars</Link>
          <Link href="/training-programs" className="text-xs hover:text-blue-400 transition">Training</Link>
          <Link href="/internships" className="text-xs hover:text-blue-400 transition">Internships</Link>
          <Link href="/services" className="text-xs hover:text-blue-400 transition">Services</Link>
          <Link href="/projects" className="text-xs hover:text-blue-400 transition">Projects</Link>
          <Link href="/blog" className="text-xs hover:text-blue-400 transition">Blog</Link>
          <Link href="/admin/login" className="text-xs hover:text-amber-400 transition">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
