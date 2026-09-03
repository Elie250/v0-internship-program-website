import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy'

const FILE = `${documentDirectory ?? ''}el-customer-cart.json`

export async function readPersistedCartJson(): Promise<string | null> {
  try {
    if (!documentDirectory) return null
    const info = await getInfoAsync(FILE)
    if (!info.exists) return null
    return await readAsStringAsync(FILE)
  } catch {
    return null
  }
}

export async function writePersistedCartJson(json: string): Promise<void> {
  if (!documentDirectory) return
  await writeAsStringAsync(FILE, json)
}
