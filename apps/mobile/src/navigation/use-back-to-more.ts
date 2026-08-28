import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'

/** Hidden More destinations are sibling tabs; hardware back would otherwise jump to POS. */
export function useBackToMore() {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/staff/menu')
        return true
      })
      return () => sub.remove()
    }, [])
  )
}
