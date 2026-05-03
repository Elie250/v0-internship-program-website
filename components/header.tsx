'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-90 transition">
          <span>Energy & Logics</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="secondary" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
