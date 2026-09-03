import { Stack } from 'expo-router'
import { colors } from '@/src/theme'

export default function SalesStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sales', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Sale' }} />
    </Stack>
  )
}
