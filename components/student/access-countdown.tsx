'use client'

import { useEffect, useState } from 'react'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function AccessCountdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  if (diff <= 0) {
    return <span className="font-semibold text-green-800">Access is opening now</span>
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return (
    <span className="font-mono text-sm font-semibold text-[var(--brand-navy)] tabular-nums">
      {days > 0 ? `${days}d ` : ''}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}
