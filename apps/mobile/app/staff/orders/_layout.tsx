import { Stack } from 'expo-router'
import { colors } from '@/src/theme'

export default function OrdersStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Orders', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Order' }} />
    </Stack>
  )
}
