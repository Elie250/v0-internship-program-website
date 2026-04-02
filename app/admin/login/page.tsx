'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    setLoading(true)
    setError('')

    const ADMIN_EMAIL = 'eliebisamaza@gmail.com'
    const ADMIN_PASSWORD = 'energylogics'

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

      // set cookie
      document.cookie = "admin_session=true; path=/; max-age=86400"

      // small delay so proxy detects cookie
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 200)

    } else {

      setError('Invalid email or password')
      setLoading(false)

    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">

      <form onSubmit={handleSubmit} className="p-6 border rounded w-80 space-y-4">

        <h2 className="text-xl font-bold">Admin Login</h2>

        {error && <p className="text-red-600">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

      </form>

    </div>
  )
}