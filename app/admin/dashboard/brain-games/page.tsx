import BrainGamesManagement from '@/components/admin/brain-games-management'

/**
 * Dedicated route (takes precedence over [section]) so this client UI
 * is not loaded through next/dynamic + server-action imports — that combo
 * was surfacing opaque production digests instead of real API errors.
 */
export default function AdminBrainGamesPage() {
  return <BrainGamesManagement />
}
