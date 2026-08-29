import { Redirect, type Href } from 'expo-router'

/**
 * Customer home lives under /customer.
 * Staff remains at /staff behind /login.
 */
export default function Index() {
  return <Redirect href={'/customer' as Href} />
}
