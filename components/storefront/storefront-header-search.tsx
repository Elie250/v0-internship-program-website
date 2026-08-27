'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { cn } from '@/lib/utils'

export function StorefrontHeaderSearch({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className={cn('h-10 min-w-0 flex-1 rounded-md bg-white/15', className)} />}>
      <StorefrontHeaderSearchForm className={className} />
    </Suspense>
  )
}

function StorefrontHeaderSearchForm({ className }: { className?: string }) {
  const t = useShopT()
  const router = useRouter()
  const params = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)

  useEffect(() => {
    setQuery(urlQuery)
  }, [urlQuery])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    router.push(value ? `/?q=${encodeURIComponent(value)}` : '/')
  }

  return (
    <form onSubmit={submit} className={cn('relative min-w-0 flex-1', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('storefront.catalogue.searchPlaceholder')}
        className="h-10 border-0 bg-white pl-9 text-slate-900 placeholder:text-slate-500"
        name="q"
        aria-label={t('action.search')}
      />
    </form>
  )
}
