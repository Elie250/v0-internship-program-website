'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeCertificateCode } from '@/lib/certificate/verify'

export function CertificateVerifyForm({ initialCode = '' }: { initialCode?: string }) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeCertificateCode(code)
    if (!normalized) {
      setError('Enter the certificate ID printed on the certificate.')
      return
    }
    setError('')
    router.push(`/verify/${encodeURIComponent(normalized)}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div>
        <Label htmlFor="certificate-id" className="text-slate-700">
          Certificate ID
        </Label>
        <Input
          id="certificate-id"
          className="mt-1.5 font-mono text-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CERT-XXXXXX-XXXXXX"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Scan the QR code on the certificate or type the ID from the footer.
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
        Verify certificate
      </Button>
    </form>
  )
}
