'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if authenticated via cookie, otherwise go to login
    const isAuthenticated = document.cookie
      .split('; ')
      .find((row) => row.startsWith('admin_session='));

    if (isAuthenticated) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return null;
}
