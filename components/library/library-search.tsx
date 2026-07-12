'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function LibrarySearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('q') ?? ''

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const q = new FormData(form).get('q')?.toString().trim() ?? ''
        const params = new URLSearchParams(searchParams.toString())
        if (q) params.set('q', q)
        else params.delete('q')
        const qs = params.toString()
        router.push(qs ? `/library?${qs}` : '/library')
      }}
    >
      <Input
        name="q"
        defaultValue={current}
        placeholder="Search titles, authors, or stories…"
        className="bg-white"
      />
      <Button type="submit" variant="outline" className="shrink-0">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  )
}
