'use client'

import { useEffect } from 'react'

const SW_URL = '/sw.js?v=3'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reloaded = false

    const onControllerChange = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_URL)
        await registration.update()

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      } catch {
        // Non-blocking if registration fails
      }
    })()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
