'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function StudentLogin() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: any) => {

    ```
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
```

  }

  return (

    ```
<main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

  <div className="bg-white shadow-lg rounded-xl p-10 max-w-md w-full">

    {/* Header */}
    <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
      Student Login
    </h1>

    <p className="text-gray-600 text-center mb-8">
      Access your dashboard and resources
    </p>

    {/* Login Form */}
    <form onSubmit={handleLogin} className="flex flex-col gap-4">

      <input
        className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

    </form>

    {/* Links */}
    <div className="mt-6 flex flex-col gap-3 text-center">

      <Link
        href="/student/register"
        className="text-blue-600 font-medium hover:underline"
      >
        Create Account
      </Link>

      <Link
        href="/student/forgot-password"
        className="text-gray-500 font-medium hover:underline"
      >
        Forgot Password?
      </Link>

    </div>

  </div>

</main>
```

  )
}
