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

export function JobBoardFilters({ filters }: { filters: FilterOptions }) {
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

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 sticky top-4"
      onSubmit={(e) => {
        e.preventDefault()
        apply(e.currentTarget)
      }}
    >
      <p className="font-semibold text-slate-900">Search &amp; filter</p>
      <div className="space-y-2">
        <Label htmlFor="search">Keywords</Label>
        <Input id="search" name="search" defaultValue={current.search} placeholder="Role, skill, keyword" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organization">Employer</Label>
        <select
          id="organization"
          name="organization"
          defaultValue={current.organization}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <select
          id="location"
          name="location"
          defaultValue={current.location}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue={current.category}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Any category</option>
          {filters.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending} className="w-full bg-[var(--brand-navy)] text-white">
        {pending ? 'Applying…' : 'Apply filters'}
      </Button>
    </form>
  )
}
