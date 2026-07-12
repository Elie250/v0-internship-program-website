import { createHmac, randomBytes } from 'crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const output: number[] = []

  for (const char of cleaned) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(output)
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

export function buildTotpUri(secret: string, email: string, issuer = 'Energy & Logics Admin'): string {
  const label = encodeURIComponent(`${issuer}:${email}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`
}

export function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  const normalized = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false

  const key = base32Decode(secret)
  const timestep = Math.floor(Date.now() / 1000 / 30)

  for (let offset = -window; offset <= window; offset += 1) {
    const counter = Buffer.alloc(8)
    const step = timestep + offset
    counter.writeUInt32BE(Math.floor(step / 0x100000000), 0)
    counter.writeUInt32BE(step & 0xffffffff, 4)

    const hmac = createHmac('sha1', key).update(counter).digest()
    const offsetBits = hmac[hmac.length - 1] & 0x0f
    const binary =
      ((hmac[offsetBits] & 0x7f) << 24) |
      ((hmac[offsetBits + 1] & 0xff) << 16) |
      ((hmac[offsetBits + 2] & 0xff) << 8) |
      (hmac[offsetBits + 3] & 0xff)
    const otp = String(binary % 1_000_000).padStart(6, '0')
    if (otp === normalized) return true
  }

  return false
}
