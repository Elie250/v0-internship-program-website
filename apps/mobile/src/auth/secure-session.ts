import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'el.staff.session.token'
const LOCK_KEY = 'el.staff.session.locked'
const EMAIL_KEY = 'el.staff.session.email'

const storeOpts = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }

async function readKey(key: string): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(key)) || null
  } catch {
    return null
  }
}

async function writeKey(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, storeOpts)
}

async function deleteKey(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch {
    /* ignore */
  }
}

export async function readStaffToken(): Promise<string | null> {
  return readKey(TOKEN_KEY)
}

export async function writeStaffToken(token: string): Promise<void> {
  await writeKey(TOKEN_KEY, token)
}

export async function clearStaffToken(): Promise<void> {
  await deleteKey(TOKEN_KEY)
}

export async function readStaffLocked(): Promise<boolean> {
  return (await readKey(LOCK_KEY)) === '1'
}

export async function writeStaffLocked(locked: boolean): Promise<void> {
  if (locked) await writeKey(LOCK_KEY, '1')
  else await deleteKey(LOCK_KEY)
}

export async function readStaffEmail(): Promise<string | null> {
  return readKey(EMAIL_KEY)
}

export async function writeStaffEmail(email: string): Promise<void> {
  await writeKey(EMAIL_KEY, email)
}

export async function clearStaffEmail(): Promise<void> {
  await deleteKey(EMAIL_KEY)
}
