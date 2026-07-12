/**
 * Copy platform-media objects from Supabase Storage to Cloudflare R2,
 * then optionally rewrite stored URLs in the database.
 *
 * Usage (from project root, with .env.local):
 *   node scripts/migrate-supabase-to-r2.mjs --dry-run
 *   node scripts/migrate-supabase-to-r2.mjs
 *   node scripts/migrate-supabase-to-r2.mjs --rewrite-urls
 *   node scripts/migrate-supabase-to-r2.mjs --urls-only
 *   node scripts/migrate-supabase-to-r2.mjs --force
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   R2_PUBLIC_BASE_URL (or NEXT_PUBLIC_R2_PUBLIC_BASE_URL) for --rewrite-urls
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const BUCKET = 'platform-media'
const SUPABASE_MARKER = `/storage/v1/object/public/${BUCKET}/`

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

function loadEnvFile(name) {
  const path = join(root, name)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    rewriteUrls: argv.includes('--rewrite-urls'),
    urlsOnly: argv.includes('--urls-only'),
    force: argv.includes('--force'),
  }
}

function guessContentType(path) {
  return MIME_BY_EXT[extname(path).toLowerCase()] ?? 'application/octet-stream'
}

function getR2PublicBase() {
  const base =
    process.env.R2_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ||
    ''
  return base.replace(/\/$/, '')
}

function parseObjectPath(publicUrl) {
  if (!publicUrl?.trim()) return null
  const mediaBase = getR2PublicBase()
  if (mediaBase && publicUrl.startsWith(mediaBase)) {
    const path = publicUrl.slice(mediaBase.length).replace(/^\//, '').split('?')[0]
    return path ? decodeURIComponent(path) : null
  }
  const idx = publicUrl.indexOf(SUPABASE_MARKER)
  if (idx === -1) return null
  const path = publicUrl.slice(idx + SUPABASE_MARKER.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

function rewriteStorageUrl(value, r2Base) {
  if (!value || typeof value !== 'string') return value
  if (!value.includes(SUPABASE_MARKER)) return value
  const path = parseObjectPath(value)
  return path ? `${r2Base}/${path}` : value
}

function shouldSkipUrlRewrite(value) {
  if (!value || typeof value !== 'string') return true
  if (!value.includes(SUPABASE_MARKER)) return true
  if (value.startsWith('/')) return true
  return false
}

function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

async function listAllObjects(supabase, prefix = '') {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw new Error(`List failed for "${prefix || '/'}": ${error.message}`)

  const paths = []
  for (const item of data ?? []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name
    if (item.metadata) {
      paths.push(itemPath)
      continue
    }
    paths.push(...(await listAllObjects(supabase, itemPath)))
  }
  return paths
}

async function r2ObjectExists(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function copyObject({ supabase, r2, r2Bucket, path, dryRun, force }) {
  if (!force) {
    const exists = await r2ObjectExists(r2, r2Bucket, path)
    if (exists) return { status: 'skipped', path }
  }

  if (dryRun) return { status: 'planned', path }

  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) {
    return { status: 'failed', path, error: error?.message ?? 'Download failed' }
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const contentType = data.type && data.type !== 'application/octet-stream'
    ? data.type
    : guessContentType(path)

  await r2.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return { status: 'copied', path, bytes: buffer.length }
}

async function rewriteDatabaseUrls(supabase, r2Base, dryRun) {
  const stats = { tables: 0, rows: 0, values: 0 }

  async function updateRows(table, column, rows, mapValue) {
    if (!rows.length) return
    stats.tables += 1
    for (const row of rows) {
      const next = mapValue(row)
      if (!next || next.changed === 0) continue
      stats.rows += 1
      stats.values += next.changed
      if (dryRun) {
        console.log(`  [dry-run] ${table}.${column} id=${row.id}`)
        continue
      }
      const { error } = await supabase.from(table).update({ [column]: next.value }).eq('id', row.id)
      if (error) throw new Error(`${table}.${column} id=${row.id}: ${error.message}`)
    }
  }

  const marker = '%/storage/v1/object/public/platform-media/%'

  const simpleTables = [
    ['services', 'image_url'],
    ['announcements', 'image_url'],
    ['courses', 'thumbnail'],
    ['course_content', 'content_url'],
    ['payments', 'receipt_url'],
    ['users', 'profile_photo_url'],
    ['lab_submissions', 'file_url'],
    ['webinars', 'recording_url'],
    ['course_sessions', 'recording_url'],
    ['events', 'image_url'],
    ['internship_applications', 'cv_url'],
  ]

  for (const [table, column] of simpleTables) {
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${column}`)
      .like(column, marker)
    if (error) {
      console.warn(`  Skip ${table}.${column}: ${error.message}`)
      continue
    }
    await updateRows(table, column, data ?? [], (row) => {
      const current = row[column]
      if (shouldSkipUrlRewrite(current)) return null
      const rewritten = rewriteStorageUrl(current, r2Base)
      if (rewritten === current) return null
      return { value: rewritten, changed: 1 }
    })
  }

  const { data: legacyProducts, error: legacyProductsError } = await supabase
    .from('products')
    .select('id, image_url')
    .like('image_url', marker)
  if (!legacyProductsError) {
    await updateRows('products', 'image_url', legacyProducts ?? [], (row) => {
      const rewritten = rewriteStorageUrl(row.image_url, r2Base)
      if (rewritten === row.image_url) return null
      return { value: rewritten, changed: 1 }
    })
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, images')
    .filter('images', 'not.is', null)
  if (!productsError) {
    await updateRows('products', 'images', products ?? [], (row) => {
      const images = Array.isArray(row.images) ? row.images : []
      let changed = 0
      const nextImages = images.map((url) => {
        if (typeof url !== 'string' || shouldSkipUrlRewrite(url)) return url
        const rewritten = rewriteStorageUrl(url, r2Base)
        if (rewritten !== url) changed += 1
        return rewritten
      })
      if (!changed) return null
      return { value: nextImages, changed }
    })
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('course_sessions')
    .select('id, session_materials')
    .like('session_materials', marker)
  if (!sessionsError) {
    await updateRows('course_sessions', 'session_materials', sessions ?? [], (row) => {
      const lines = String(row.session_materials ?? '').split('\n')
      let changed = 0
      const nextLines = lines.map((line) => {
        const trimmed = line.trim()
        if (!trimmed || shouldSkipUrlRewrite(trimmed)) return line
        const rewritten = rewriteStorageUrl(trimmed, r2Base)
        if (rewritten !== trimmed) changed += 1
        return rewritten
      })
      if (!changed) return null
      return { value: nextLines.join('\n'), changed }
    })
  }

  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['company_logo_url', 'hero_videos_base_url'])
    .like('value', marker)
  if (!settingsError) {
    for (const row of settings ?? []) {
      if (shouldSkipUrlRewrite(row.value)) continue
      const rewritten = rewriteStorageUrl(row.value, r2Base)
      if (rewritten === row.value) continue
      stats.tables += 1
      stats.rows += 1
      stats.values += 1
      if (dryRun) {
        console.log(`  [dry-run] site_settings.${row.key}`)
        continue
      }
      const { error } = await supabase
        .from('site_settings')
        .update({ value: rewritten, updated_at: new Date().toISOString() })
        .eq('key', row.key)
      if (error) throw new Error(`site_settings.${row.key}: ${error.message}`)
    }
  }

  const { data: heroRows, error: heroError } = await supabase
    .from('site_hero')
    .select('id, background_image')
    .like('background_image', marker)
  if (!heroError) {
    await updateRows('site_hero', 'background_image', heroRows ?? [], (row) => {
      const current = row.background_image
      if (shouldSkipUrlRewrite(current) || current === '/videos/playlist') return null
      const rewritten = rewriteStorageUrl(current, r2Base)
      if (rewritten === current) return null
      return { value: rewritten, changed: 1 }
    })
  }

  return stats
}

async function main() {
  loadEnvFile('.env.local')
  loadEnvFile('.env')

  const args = parseArgs(process.argv.slice(2))
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const r2Bucket = process.env.R2_BUCKET_NAME?.trim() || BUCKET
  const r2Base = getR2PublicBase()

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!args.urlsOnly && !process.env.R2_ACCOUNT_ID) {
    console.error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.')
    process.exit(1)
  }
  if ((args.rewriteUrls || args.urlsOnly) && !r2Base) {
    console.error('Missing R2_PUBLIC_BASE_URL for URL rewrite.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const r2 = args.urlsOnly ? null : createR2Client()

  if (!args.urlsOnly) {
    console.log(`Listing objects in Supabase bucket "${BUCKET}"…`)
    const paths = await listAllObjects(supabase)
    console.log(`Found ${paths.length} object(s).\n`)

    const summary = { copied: 0, skipped: 0, failed: 0, planned: 0 }
    for (const path of paths) {
      const result = await copyObject({
        supabase,
        r2,
        r2Bucket,
        path,
        dryRun: args.dryRun,
        force: args.force,
      })
      summary[result.status] = (summary[result.status] ?? 0) + 1
      if (result.status === 'copied') {
        console.log(`✓ ${path} (${(result.bytes / 1024).toFixed(1)} KB)`)
      } else if (result.status === 'planned') {
        console.log(`• ${path}`)
      } else if (result.status === 'skipped') {
        console.log(`↷ ${path} (already on R2)`)
      } else {
        console.error(`✗ ${path}: ${result.error}`)
      }
    }

    console.log('\nFile copy summary:', summary)
  }

  if (args.rewriteUrls || args.urlsOnly) {
    console.log(`\nRewriting database URLs → ${r2Base}`)
    const urlStats = await rewriteDatabaseUrls(supabase, r2Base, args.dryRun)
    console.log('URL rewrite summary:', urlStats)
  } else {
    console.log('\nDatabase URLs were not changed. Re-run with --rewrite-urls when files are on R2.')
  }

  if (args.dryRun) {
    console.log('\nDry run only — no files or database rows were modified.')
  } else {
    console.log('\nDone.')
    console.log(`Public media base: ${r2Base || '(set R2_PUBLIC_BASE_URL)'}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
