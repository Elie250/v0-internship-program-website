import { createStudent } from './actions'

export default function SignupPage() {

  return (

    <form action={createStudent} className="max-w-md mx-auto p-10 space-y-4">

      <h1 className="text-2xl font-bold">
        Create Student Account
      </h1>

      <input
        name="username"
        placeholder="Username"
        className="border p-2 w-full"
      />

      <input
        name="email"
        placeholder="Email"
        className="border p-2 w-full"
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        className="border p-2 w-full"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2"
      >
        Create Account
      </button>

    </form>

  )

}