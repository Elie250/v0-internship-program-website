'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StudentLogin() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Login failed")
        setLoading(false)
        return
      }

      localStorage.setItem("student_auth_token", data.token)
      localStorage.setItem("student_email", data.email)
      localStorage.setItem("student_id", data.student_id)
      localStorage.setItem("student_name", data.name)

      router.push("/student/dashboard")

    } catch (err) {
      setError("Internal server error")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-xl p-10 max-w-md w-full">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Student Login
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Access your dashboard and resources
        </p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Alternative Actions */}
        <div className="mt-6 flex flex-col gap-3 text-center">
          <a
            href="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Create Account
          </a>
          <a
            href="/student/forgot-password"
            className="text-gray-500 font-medium hover:underline"
          >
            Forgot Password?
          </a>
        </div>
      </div>
    </main>
  )
}