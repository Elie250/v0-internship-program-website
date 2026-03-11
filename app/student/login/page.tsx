import { loginStudent } from './actions'

export default function LoginPage() {

  return (

    <form action={loginStudent} className="max-w-md mx-auto p-10 space-y-4">

      <h1 className="text-2xl font-bold">
        Student Login
      </h1>

      <input
        name="username"
        placeholder="Username"
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
        className="bg-green-600 text-white px-4 py-2"
      >
        Login
      </button>

    </form>

  )

}