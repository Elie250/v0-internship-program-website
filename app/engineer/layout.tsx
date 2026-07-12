import { Suspense } from 'react'

export default function EngineerLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
