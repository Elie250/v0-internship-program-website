import * as Updates from 'expo-updates'

/** Apply a published EAS Update on standalone builds. Expo Go / Metro stay unchanged. */
export async function applyAvailableOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return

  try {
    const check = await Updates.checkForUpdateAsync()
    if (!check.isAvailable) return
    const fetched = await Updates.fetchUpdateAsync()
    if (fetched.isNew) {
      await Updates.reloadAsync()
    }
  } catch (error) {
    console.warn('[ota] update check skipped', error)
  }
}
