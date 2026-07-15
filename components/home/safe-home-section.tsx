import type { ReactNode } from 'react'

/** Catch section-level failures so one bad query cannot digest-crash `/`. */
export async function SafeHomeSection({
  children,
  label,
}: {
  children: Promise<ReactNode> | ReactNode
  label: string
}) {
  try {
    return <>{await children}</>
  } catch (error) {
    console.error(`[home] section "${label}" failed:`, error)
    return null
  }
}
