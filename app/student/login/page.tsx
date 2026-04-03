'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StudentLogin() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: any) => {

    e.preventDefault()

    setLoading(true)
    setError("")

    const res = await fetch("/api/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message)
      setLoading(false)
      return
    }

    localStorage.setItem("student_auth_token", data.token)
    localStorage.setItem("student_email", data.email)

    router.push("/student/dashboard")

  }

  return (

    <main className="min-h-screen flex items-center justify-center">

      <form onSubmit={handleLogin} className="space-y-4 w-80">

        <h1 className="text-2xl font-bold">Student Loggin</h1>

        <input
          className="border p-2 w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500">{error}</p>}

        <button
          className="bg-blue-600 text-white p-2 w-full"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

    </main>

  )

}