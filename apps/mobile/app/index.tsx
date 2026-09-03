import { Redirect, type Href } from 'expo-router'

/**
 * Customer home is always the default launch route.
 * A stored staff token must not hijack shop browsing.
 * Staff mode is entered from Staff sign-in or Account > Staff.
 */
export default function Index() {
  return <Redirect href={'/customer' as Href} />
}
