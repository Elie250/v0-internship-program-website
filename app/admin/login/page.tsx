'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: any) => {

    e.preventDefault()
    setLoading(true)
    setError('')

    const ADMIN_EMAIL = "eliebisamaza@gmail.com"
    const ADMIN_PASSWORD = "energylogics"

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

      // ✅ Save local auth
      localStorage.setItem('admin_authenticated', 'true')

      // ✅ Create cookie for proxy
      document.cookie = "admin_session=true; path=/"

      // redirect
      router.push('/admin/dashboard')

    } else {
      setError("Invalid email or password")
    }

    setLoading(false)
  }

  return (

    <div className="flex items-center justify-center min-h-screen bg-slate-50">

      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded p-6 w-80 space-y-4"
      >

        <h2 className="text-xl font-bold text-center">
          Admin Login
        </h2>

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

    </div>
  )
}