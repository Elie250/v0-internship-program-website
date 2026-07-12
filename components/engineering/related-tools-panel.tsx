import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { relatedToolsForTags } from '@/lib/engineering/tool-links'

export function RelatedToolsPanel({ tags }: { tags: string[] }) {
  const tools = relatedToolsForTags(tags)
  if (tools.length === 0) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-[var(--brand-navy)]" />
        <h2 className="font-semibold text-slate-900">Related tools</h2>
      </div>
      <p className="text-sm text-slate-600">
        Put this article into practice with our free engineering calculators.
      </p>
      <ul className="space-y-2">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block rounded-lg border border-slate-200 px-3 py-2 hover:border-[var(--brand-navy)]/30 hover:bg-slate-50"
            >
              <p className="font-medium text-[var(--brand-navy)]">{tool.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{tool.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
