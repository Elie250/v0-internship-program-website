/**
 * Future Energy & Logics device control (Bluetooth lamps, Wi-Fi, Matter, MQTT).
 * Not implemented — shop/customer/staff only. Future modules can live beside this stub.
 */
export const DEVICE_CONTROL_ENABLED = false

export function assertDeviceControlNotReady(): never {
  throw new Error('Device control is not part of this release.')
}
