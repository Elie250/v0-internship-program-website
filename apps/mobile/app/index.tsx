import { Redirect, type Href } from 'expo-router'
import { useSessionStore } from '@/src/auth/session-store'

/**
 * Customer home is the default. A restored staff session opens the staff area.
 * Logout returns here via /customer, not a dead login screen.
 */
export default function Index() {
  const hydrated = useSessionStore((s) => s.hydrated)
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)

  if (!hydrated) return null
  if (token && user) return <Redirect href="/staff" />
  return <Redirect href={'/customer' as Href} />
}
