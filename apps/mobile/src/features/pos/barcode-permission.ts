export const CAMERA_PERMISSION_PROMPT = 'Allow camera access to scan products.'
export const CAMERA_PERMISSION_BLOCKED =
  'Camera access is turned off. Return to POS, or enable Camera for this app in Android settings.'
export const SCAN_BARCODE_TITLE = 'Scan barcode'

export type CameraPermissionSnapshot = {
  granted: boolean
  canAskAgain: boolean
}

export type CameraPermissionPhase = 'loading' | 'prompt' | 'blocked' | 'ready'

export function cameraPermissionPhase(
  permission: CameraPermissionSnapshot | null | undefined
): CameraPermissionPhase {
  if (!permission) return 'loading'
  if (permission.granted) return 'ready'
  if (!permission.canAskAgain) return 'blocked'
  return 'prompt'
}

/** Permanent denial must not trigger another system prompt. */
export function shouldRequestCameraPermission(
  permission: CameraPermissionSnapshot | null | undefined
): boolean {
  return cameraPermissionPhase(permission) === 'prompt'
}
