/**
 * Practical assessment artifact validation.
 * ZIP packages are opaque blobs — never extracted server-side.
 */

export const PRACTICAL_UPLOAD_MAX_BYTES = 25 * 1024 * 1024

export const PRACTICAL_ALLOWED_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'st',
  'scl',
  'xml',
  'json',
  'py',
  'c',
  'h',
  'ino',
  'txt',
  'csv',
  'zip',
] as const

export type PracticalAllowedExtension = (typeof PRACTICAL_ALLOWED_EXTENSIONS)[number]

const EXTENSION_TO_MIME: Record<PracticalAllowedExtension, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  st: ['text/plain', 'application/octet-stream'],
  scl: ['text/plain', 'application/octet-stream'],
  xml: ['application/xml', 'text/xml', 'application/octet-stream'],
  json: ['application/json', 'text/plain', 'application/octet-stream'],
  py: ['text/x-python', 'text/plain', 'application/octet-stream'],
  c: ['text/x-c', 'text/plain', 'application/octet-stream'],
  h: ['text/x-c', 'text/plain', 'application/octet-stream'],
  ino: ['text/plain', 'application/octet-stream'],
  txt: ['text/plain'],
  csv: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
}

/** Executable / script signatures that must never pass as allowed engineering files. */
const FORBIDDEN_HEADERS: Array<{ label: string; test: (buf: Buffer) => boolean }> = [
  { label: 'Windows PE executable', test: (b) => b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a }, // MZ
  { label: 'ELF executable', test: (b) => b.length >= 4 && b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46 },
  {
    label: 'Mach-O executable',
    test: (b) =>
      b.length >= 4 &&
      ((b[0] === 0xfe && b[1] === 0xed && b[2] === 0xfa) ||
        (b[0] === 0xcf && b[1] === 0xfa && b[2] === 0xed)),
  },
]

function looksLikePdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-'
}

function looksLikePng(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
}

function looksLikeJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
}

function looksLikeZip(buf: Buffer): boolean {
  // PK\x03\x04, PK\x05\x06 (empty), PK\x07\x08
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07)
}

function isMostlyText(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 2048))
  if (!sample.length) return false
  let weird = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i]
    const ok =
      c === 0x09 ||
      c === 0x0a ||
      c === 0x0d ||
      (c >= 0x20 && c <= 0x7e) ||
      c >= 0x80
    if (!ok) weird += 1
  }
  return weird / sample.length < 0.02
}

function looksLikeXml(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(buf.length, 256)).toString('utf8').trimStart()
  return head.startsWith('<?xml') || head.startsWith('<')
}

function looksLikeJson(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(buf.length, 256)).toString('utf8').trimStart()
  return head.startsWith('{') || head.startsWith('[')
}

export function practicalFileExtension(fileName: string): string {
  const parts = fileName.split('.')
  if (parts.length < 2) return ''
  return (parts.pop() || '').toLowerCase()
}

export function isPracticalAllowedExtension(ext: string): ext is PracticalAllowedExtension {
  return (PRACTICAL_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
}

/**
 * Validate extension, declared MIME, size, and content signatures where practical.
 * Text/source formats use conservative "mostly text + no executable header" checks.
 */
export function validatePracticalUploadFile(file: {
  name: string
  type: string
  size: number
  bytes?: ArrayBuffer | Uint8Array | Buffer
}): { ok: true; contentType: string; extension: PracticalAllowedExtension } | { ok: false; error: string } {
  if (!file?.name?.trim()) return { ok: false, error: 'File name is required' }
  const rawName = file.name.trim()
  if (/[\\/]|\.\./.test(rawName)) {
    return { ok: false, error: 'File name contains invalid path characters' }
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: 'File is empty' }
  }
  if (file.size > PRACTICAL_UPLOAD_MAX_BYTES) {
    return { ok: false, error: 'File must be under 25 MB' }
  }

  const extension = practicalFileExtension(rawName)
  if (!isPracticalAllowedExtension(extension)) {
    return {
      ok: false,
      error: `Unsupported file type .${extension || '(none)'}. Allowed: ${PRACTICAL_ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  const allowedMimes = EXTENSION_TO_MIME[extension]
  const declared = String(file.type || '').trim().toLowerCase()
  if (declared && declared !== 'application/octet-stream' && !allowedMimes.includes(declared)) {
    return {
      ok: false,
      error: `MIME type ${declared} is not allowed for .${extension}`,
    }
  }

  if (file.bytes) {
    const buf = Buffer.isBuffer(file.bytes)
      ? file.bytes
      : Buffer.from(file.bytes instanceof ArrayBuffer ? new Uint8Array(file.bytes) : file.bytes)

    for (const forbidden of FORBIDDEN_HEADERS) {
      if (forbidden.test(buf)) {
        return { ok: false, error: `File content looks like a ${forbidden.label}` }
      }
    }

    if (extension === 'pdf' && !looksLikePdf(buf)) {
      return { ok: false, error: 'File content is not a valid PDF' }
    }
    if (extension === 'png' && !looksLikePng(buf)) {
      return { ok: false, error: 'File content is not a valid PNG' }
    }
    if ((extension === 'jpg' || extension === 'jpeg') && !looksLikeJpeg(buf)) {
      return { ok: false, error: 'File content is not a valid JPEG' }
    }
    if (extension === 'zip' && !looksLikeZip(buf)) {
      return { ok: false, error: 'File content is not a valid ZIP archive' }
    }
    if (extension === 'xml' && (!isMostlyText(buf) || !looksLikeXml(buf))) {
      return { ok: false, error: 'File content is not valid XML text' }
    }
    if (extension === 'json' && (!isMostlyText(buf) || !looksLikeJson(buf))) {
      return { ok: false, error: 'File content is not valid JSON text' }
    }
    if (['st', 'scl', 'py', 'c', 'h', 'ino', 'txt', 'csv'].includes(extension) && !isMostlyText(buf)) {
      return {
        ok: false,
        error: `File content for .${extension} must be plain text (binary payloads are rejected)`,
      }
    }
  }

  const contentType =
    declared && allowedMimes.includes(declared)
      ? declared
      : allowedMimes[0] || 'application/octet-stream'

  return { ok: true, contentType, extension }
}

/**
 * Storage keys for practical artifacts must be server-minted under this prefix shape:
 * assessment-submissions/{courseId}/{assessmentId}/{userId}/...
 */
export function isAuthorizedPracticalStorageKey(
  storageKey: string,
  expected: { courseId: string; assessmentId: string; userId: string }
): boolean {
  const key = String(storageKey ?? '').replace(/^\//, '')
  const prefix = `assessment-submissions/${expected.courseId}/${expected.assessmentId}/${expected.userId}/`
  if (!key.startsWith(prefix)) return false
  if (key.includes('..')) return false
  return key.length > prefix.length
}
