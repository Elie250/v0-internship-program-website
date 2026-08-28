import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'el.staff.session.token'

export async function readStaffToken(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) || null
  } catch {
    return null
  }
}

export async function writeStaffToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  })
}

export async function clearStaffToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}
