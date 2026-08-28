/**
 * Future Energy & Logics device control (Bluetooth lamps, Wi-Fi, Matter, MQTT).
 * Not implemented in Phase 1E.5-B — commerce/POS only.
 */
export const DEVICE_CONTROL_ENABLED = false

export function assertDeviceControlNotReady(): never {
  throw new Error('Device control is not part of this release.')
}
