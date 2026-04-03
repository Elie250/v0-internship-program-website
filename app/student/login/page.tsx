'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // stop form from refreshing page
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      console.log('Login success:', data); // Check fetched user
      alert(`Welcome ${data.name}, status: ${data.status}`);
      setLoading(false);

      // Optional: redirect to dashboard or homepage
      // router.push('/student/dashboard');

    } catch (err) {
      console.error(err);
      setError('An error occurred');
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    router.push('/register'); // Redirect to app/register/page.tsx
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Student Login</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="mb-4">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit" // must be submit
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <Button
          type="button"
          onClick={handleCreateAccount}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Create Account
        </Button>
      </form>
    </div>
  );
}