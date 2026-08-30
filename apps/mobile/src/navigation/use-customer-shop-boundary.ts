import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter, useSegments } from 'expo-router'
import { useSessionStore } from '@/src/auth/session-store'

const NESTED = new Set(['product', 'checkout', 'track', 'order', 'language'])

/**
 * While the customer shop is focused:
 * - lock any leftover unlocked staff session
 * - consume hardware back only when it would leave the shop stack
 *   (so a staff screen is not restored without authentication)
 */
export function useCustomerShopBoundary() {
  const segments = useSegments()
  const router = useRouter()

  useFocusEffect(
    useCallback(() => {
      const lockStaffIfPresent = () => {
        const { hydrated, token, locked, lock } = useSessionStore.getState()
        if (hydrated && token && !locked) void lock()
      }
      lockStaffIfPresent()
      const unsub = useSessionStore.subscribe(lockStaffIfPresent)

      const parts = segments as string[]
      const nested = parts.some((segment) => NESTED.has(segment))
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (nested) return false
        return router.canGoBack()
      })
      return () => {
        unsub()
        sub.remove()
      }
    }, [segments, router])
  )
}
