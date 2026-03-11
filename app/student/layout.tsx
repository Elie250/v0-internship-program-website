'use client';

import Link from 'next/link';

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Card container */}
      <div className="bg-white shadow-lg rounded-xl p-10 max-w-md w-full">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Student Login
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Access your dashboard and resources
        </p>

        {/* Login Form */}
        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        {/* Alternative Actions */}
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
    </div>
  );
}