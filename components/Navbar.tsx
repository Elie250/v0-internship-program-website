'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-gray-100 shadow-lg sticky top-0 z-50">
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
            <Link href="/" className="hover:text-cyan-400 transition text-sm">Home</Link>
            <Link href="/webinars" className="hover:text-cyan-400 transition text-sm">Webinars</Link>
            <Link href="/training-programs" className="hover:text-cyan-400 transition text-sm">Training</Link>
            <Link href="/internships" className="hover:text-cyan-400 transition text-sm">Internships</Link>
            <Link href="/services" className="hover:text-cyan-400 transition text-sm">Services</Link>
            <Link href="/projects" className="hover:text-cyan-400 transition text-sm">Projects</Link>
            <Link href="/blog" className="hover:text-cyan-400 transition text-sm">Blog</Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2 sm:gap-4">
            <Link
              href="/student/login"
              className="px-3 sm:px-4 py-2 border border-green-400 text-green-300 hover:bg-green-400/10 rounded-lg font-semibold transition text-xs sm:text-sm"
            >
              Student Login
            </Link>
            <Link
              href="/admin/login"
              className="px-3 sm:px-4 py-2 border border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 rounded-lg font-semibold transition text-xs sm:text-sm"
            >
              Admin
            </Link>
            <Link
              href="/register"
              className="px-3 sm:px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition text-xs sm:text-sm"
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex flex-wrap gap-2 pb-4">
          <Link href="/" className="text-xs hover:text-cyan-400 transition">Home</Link>
          <Link href="/webinars" className="text-xs hover:text-cyan-400 transition">Webinars</Link>
          <Link href="/training-programs" className="text-xs hover:text-cyan-400 transition">Training</Link>
          <Link href="/internships" className="text-xs hover:text-cyan-400 transition">Internships</Link>
          <Link href="/services" className="text-xs hover:text-cyan-400 transition">Services</Link>
          <Link href="/projects" className="text-xs hover:text-cyan-400 transition">Projects</Link>
          <Link href="/blog" className="text-xs hover:text-cyan-400 transition">Blog</Link>
          <Link href="/student/login" className="text-xs hover:text-green-300 transition">Student</Link>
          <Link href="/admin/login" className="text-xs hover:text-yellow-300 transition">Admin</Link>
          <Link href="/register" className="text-xs hover:text-indigo-400 transition">Register</Link>
        </div>
      </div>
    </nav>
  );
}