import { Cpu, Plug, Sun, Zap, type LucideIcon } from 'lucide-react'
import { CALCULATOR_FOLDERS } from '@/lib/engineering/calculator-catalog'

/** Shared between the client tools panel and server-rendered home section. */
export const ENGINEERING_TOOL_CATEGORIES: {
  id: string
  title: string
  icon: LucideIcon
  summary: string
}[] = CALCULATOR_FOLDERS.map((folder) => {
  const iconMap: Record<string, LucideIcon> = {
    electrical: Zap,
    installation: Plug,
    embedded: Cpu,
    solar: Sun,
  }
  return {
    id: folder.id,
    title: folder.title,
    icon: iconMap[folder.id] ?? Zap,
    summary: folder.summary,
  }
})
