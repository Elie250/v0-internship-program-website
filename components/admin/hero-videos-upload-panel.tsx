'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'
import { HERO_VIDEO_MAX_BYTES } from '@/lib/storage/hero-video-upload'
import { CheckCircle2, Upload, Video } from 'lucide-react'

type VideoStatus = {
  file: string
  label: string
  url: string
  exists: boolean
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function uploadWithProgress(
  signedUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      const detail = xhr.responseText?.slice(0, 200)
      reject(new Error(detail ? `Upload failed (${xhr.status}): ${detail}` : `Upload failed (${xhr.status})`))
    }

    xhr.onerror = () => reject(new Error('Network error during upload — check your connection and try again'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))

    const onAbort = () => xhr.abort()
    signal.addEventListener('abort', onAbort, { once: true })

    xhr.send(file)
  })
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
  const [progressLabel, setProgressLabel] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

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

  const cancelUpload = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setUploading(false)
    setProgressLabel('')
    setProgressPercent(0)
    setError('Upload cancelled.')
  }

  const handleUpload = async () => {
    const selected = HERO_VIDEO_FILES.filter(({ file }) => files[file])
      .map(({ file, label }) => ({ file, label, blob: files[file]! }))
      .sort((a, b) => a.blob.size - b.blob.size)

    if (!selected.length) {
      setError('Select at least one video file to upload.')
      return
    }

    for (const { file, blob } of selected) {
      if (blob.size > HERO_VIDEO_MAX_BYTES) {
        setError(`${file} is ${formatMb(blob.size)} — max is ${formatMb(HERO_VIDEO_MAX_BYTES)}. Compress or use a smaller file.`)
        return
      }
    }

    setUploading(true)
    setError('')
    setMessage('')
    setProgressPercent(0)
    abortRef.current = new AbortController()
    let ok = 0

    try {
      for (const { file, label, blob } of selected) {
        setProgressLabel(`Uploading ${label} (${formatMb(blob.size)})…`)
        setProgressPercent(0)

        const signRes = await fetch('/api/admin/hero-videos/sign', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file, size: blob.size }),
          signal: abortRef.current.signal,
        })
        const signData = await signRes.json()
        if (!signRes.ok) {
          throw new Error(signData.hint ? `${signData.error} — ${signData.hint}` : signData.error || `Could not sign ${file}`)
        }

        if (!signData.signedUrl) {
          throw new Error(`No upload URL returned for ${file}`)
        }

        await uploadWithProgress(
          signData.signedUrl,
          blob,
          signData.contentType || blob.type || 'application/octet-stream',
          setProgressPercent,
          abortRef.current.signal
        )
        ok += 1
      }

      setMessage(`Uploaded ${ok} video(s) to media storage.`)
      setProgressLabel('')
      setProgressPercent(0)
      onPlaylistReady?.()
      await loadStatus()
      setFiles({})
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
      setProgressLabel('')
      setProgressPercent(0)
    } finally {
      abortRef.current = null
      setUploading(false)
    }
  }

  const uploadedCount = status.filter((s) => s.exists).length

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Video className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Hero video library (Cloudflare R2)</p>
          <p className="text-sm text-slate-600 mt-1">
            Pick your video files below — they upload <strong>directly to your media CDN</strong> (no Vercel size limit).
            Large files can take several minutes; keep this tab open until the progress bar finishes.
            After upload, use background URL <strong>/videos/playlist</strong> and save.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Max {formatMb(HERO_VIDEO_MAX_BYTES)} per file. MP4 is recommended over MOV for faster uploads.
          </p>
          {!loading ? (
            <p className="text-xs text-slate-500 mt-1">
              {uploadedCount} of {HERO_VIDEO_FILES.length} videos on media storage
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
        {HERO_VIDEO_FILES.map(({ file, label }) => {
          const picked = files[file]
          return (
            <div key={file}>
              <Label className="text-slate-800 text-sm">{label}</Label>
              <input
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-navy)] file:px-3 file:py-1.5 file:text-white file:text-sm"
                disabled={uploading}
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null
                  setFiles((prev) => ({ ...prev, [file]: next }))
                }}
              />
              <p className="text-xs text-slate-500 mt-0.5">
                Stored as: hero/{file} on Cloudflare R2
                {picked ? ` · selected: ${formatMb(picked.size)}` : ''}
              </p>
            </div>
          )
        })}
      </div>

      {uploading ? (
        <div className="space-y-2">
          {progressLabel ? <p className="text-sm text-slate-700">{progressLabel}</p> : null}
          <Progress value={progressPercent} className="h-2 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-[var(--brand-navy)]" />
          <p className="text-xs text-slate-500">{progressPercent}% — do not close this page</p>
        </div>
      ) : null}

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
          {uploading ? 'Uploading…' : 'Upload videos to R2'}
        </Button>
        {uploading ? (
          <Button type="button" variant="outline" onClick={cancelUpload}>
            Cancel
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={loadStatus} disabled={loading || uploading}>
          Refresh status
        </Button>
      </div>
    </div>
  )
}
