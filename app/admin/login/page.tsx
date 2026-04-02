'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: any) => {

    e.preventDefault()

    const ADMIN_EMAIL = "eliebisamaza@gmail.com"
    const ADMIN_PASSWORD = "energylogics"

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

      // create session cookie
      document.cookie = "admin_session=true; path=/"

      // redirect to dashboard
      router.push('/admin/dashboard')

    } else {
      setError("Invalid email or password")
    }

  }

  return (

    <div className="flex items-center justify-center min-h-screen">

      <form onSubmit={handleLogin} className="border p-6 rounded w-80 space-y-4">

        <h2 className="text-xl font-bold">Admin Login</h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2"
          required
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Login
        </button>

      </form>

    </div>
  )
}