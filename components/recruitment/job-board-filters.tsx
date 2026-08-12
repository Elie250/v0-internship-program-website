'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FilterOptions = {
  organizations: Array<{ name: string; slug: string }>
  locations: string[]
  categories: string[]
  employmentTypes: string[]
}

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]/25 focus-visible:border-[var(--brand-navy)]'

export function JobBoardFilters({
  filters,
  compact = false,
}: {
  filters: FilterOptions
  compact?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const current = {
    search: searchParams.get('search') ?? '',
    organization: searchParams.get('organization') ?? '',
    location: searchParams.get('location') ?? '',
    employmentType: searchParams.get('employmentType') ?? '',
    category: searchParams.get('category') ?? '',
  }

  const apply = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const params = new URLSearchParams()
    for (const key of ['search', 'organization', 'location', 'employmentType', 'category']) {
      const value = String(data.get(key) ?? '').trim()
      if (value) params.set(key, value)
    }
    startTransition(() => {
      router.push(`/jobs?${params.toString()}`)
    })
  }

  const clear = () => {
    startTransition(() => {
      router.push('/jobs')
    })
  }

  const hasFilters = Object.values(current).some(Boolean)

  return (
    <form
      className={
        compact
          ? 'space-y-3'
          : 'rounded-2xl border border-slate-200 bg-white p-5 space-y-4 sticky top-24 shadow-[0_1px_0_rgba(15,23,42,0.04)]'
      }
      onSubmit={(e) => {
        e.preventDefault()
        apply(e.currentTarget)
      }}
    >
      {!compact ? (
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">Refine search</p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-[var(--brand-navy)] hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="search">Keywords</Label>
        <Input
          id="search"
          name="search"
          defaultValue={current.search}
          placeholder="Role, skill, or keyword"
          className="h-11 rounded-lg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organization">Employer</Label>
        <select
          id="organization"
          name="organization"
          defaultValue={current.organization}
          className={selectClass}
        >
          <option value="">All employers</option>
          {filters.organizations.map((org) => (
            <option key={org.slug} value={org.slug}>
              {org.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <select id="location" name="location" defaultValue={current.location} className={selectClass}>
          <option value="">Any location</option>
          {filters.locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="employmentType">Employment type</Label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue={current.employmentType}
          className={selectClass}
        >
          <option value="">Any type</option>
          {filters.employmentTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Discipline</Label>
        <select id="category" name="category" defaultValue={current.category} className={selectClass}>
          <option value="">Any discipline</option>
          {filters.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
      >
        {pending ? 'Updating…' : 'Show matching roles'}
      </Button>
    </form>
  )
}
