/**
 * Upload hero videos from public/videos/ to Supabase platform-media/hero/
 *
 * Usage (from project root, with .env.local):
 *   node scripts/upload-hero-videos.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

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

loadEnvFile('.env.local')
loadEnvFile('.env')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const FILES = [
  'e-learning.mp4',
  'transmission-line.mp4',
  'embedded-programming.mp4',
  'electronics.mov',
]

const supabase = createClient(supabaseUrl, serviceKey)
const videosDir = join(root, 'public', 'videos')

async function main() {
  console.log('Uploading hero videos to Supabase platform-media/hero/ …\n')

  for (const file of FILES) {
    const localPath = join(videosDir, file)
    if (!existsSync(localPath)) {
      console.warn(`Skip ${file} — not found at ${localPath}`)
      continue
    }

    const buffer = readFileSync(localPath)
    if (buffer.length < 1000) {
      console.warn(`Skip ${file} — file is only ${buffer.length} bytes (Git LFS pointer?). Run: git lfs pull`)
      continue
    }

    const storagePath = `hero/${file}`
    const contentType = file.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'

    const { error } = await supabase.storage.from('platform-media').upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

    if (error) {
      console.error(`Failed ${file}:`, error.message)
      continue
    }

    const { data } = supabase.storage.from('platform-media').getPublicUrl(storagePath)
    console.log(`✓ ${file} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
    console.log(`  ${data.publicUrl}\n`)
  }

  const base = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/platform-media/hero`
  console.log('Done. Videos will load from Supabase when NEXT_PUBLIC_SUPABASE_URL is set on Vercel.')
  console.log(`Optional env override: NEXT_PUBLIC_HERO_VIDEOS_BASE_URL=${base}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
