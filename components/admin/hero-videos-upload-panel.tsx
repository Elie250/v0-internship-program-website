'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'
import { CheckCircle2, Upload, Video } from 'lucide-react'

type VideoStatus = {
  file: string
  label: string
  url: string
  exists: boolean
}

export function HeroVideosUploadPanel({
  onPlaylistReady,
}: {
  onPlaylistReady?: () => void
}) {
  const [status, setStatus] = useState<VideoStatus[]>([])
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/hero-videos', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to check videos')
      setStatus(Array.isArray(data.files) ? data.files : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const handleUpload = async () => {
    const selected = HERO_VIDEO_FILES.filter(({ file }) => files[file])
    if (!selected.length) {
      setError('Select at least one video file to upload.')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    let ok = 0

    try {
      for (const { file, label } of selected) {
        const blob = files[file]
        if (!blob) continue

        setProgress(`Uploading ${label}…`)

        const signRes = await fetch('/api/admin/hero-videos/sign', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file }),
        })
        const signData = await signRes.json()
        if (!signRes.ok) throw new Error(signData.error || `Could not sign ${file}`)

        const { error: uploadError } = await supabase.storage
          .from('platform-media')
          .uploadToSignedUrl(signData.path, signData.token, blob, { upsert: true })

        if (uploadError) throw new Error(`${label}: ${uploadError.message}`)
        ok += 1
      }

      setMessage(`Uploaded ${ok} video(s) to Supabase storage.`)
      setProgress('')
      onPlaylistReady?.()
      await loadStatus()
      setFiles({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setProgress('')
    } finally {
      setUploading(false)
    }
  }

  const uploadedCount = status.filter((s) => s.exists).length

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Video className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Hero video library (Supabase)</p>
          <p className="text-sm text-slate-600 mt-1">
            Pick your video files below — they upload <strong>directly to Supabase</strong> (no folder to create).
            After upload, use background URL <strong>/videos/playlist</strong> and save.
          </p>
          {!loading ? (
            <p className="text-xs text-slate-500 mt-1">
              {uploadedCount} of {HERO_VIDEO_FILES.length} videos on Supabase
            </p>
          ) : null}
        </div>
      </div>

      {status.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {status.map((item) => (
            <li key={item.file} className="flex items-center gap-2">
              {item.exists ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={item.exists ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
              <span className="text-xs text-slate-400 truncate">{item.file}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-3">
        {HERO_VIDEO_FILES.map(({ file, label }) => (
          <div key={file}>
            <Label className="text-slate-800 text-sm">{label}</Label>
            <input
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-navy)] file:px-3 file:py-1.5 file:text-white file:text-sm"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null
                setFiles((prev) => ({ ...prev, [file]: picked }))
              }}
            />
            <p className="text-xs text-slate-500 mt-0.5">Stored as: platform-media/hero/{file}</p>
          </div>
        ))}
      </div>

      {progress ? <p className="text-sm text-slate-600">{progress}</p> : null}
      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="bg-[var(--brand-navy)] text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading…' : 'Upload videos to Supabase'}
        </Button>
        <Button type="button" variant="outline" onClick={loadStatus} disabled={loading}>
          Refresh status
        </Button>
      </div>
    </div>
  )
}
