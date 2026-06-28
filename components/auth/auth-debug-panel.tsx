'use client'

import { AuthDebugInfo } from '@/lib/auth-debug'

export function AuthDebugPanel({
  error,
  debug,
}: {
  error?: string
  debug?: AuthDebugInfo | null
}) {
  if (!error && !debug) return null

  const payload = JSON.stringify({ error, debug }, null, 2)

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left">
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
        Debug details — copy and share this block
      </p>
      {error && (
        <p className="text-sm text-destructive font-medium mb-2">{error}</p>
      )}
      {debug && (
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all text-muted-foreground max-h-64 overflow-y-auto">
          {payload}
        </pre>
      )}
    </div>
  )
}
