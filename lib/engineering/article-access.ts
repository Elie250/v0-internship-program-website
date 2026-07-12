import type { EngineeringArticleTier } from '@/lib/engineering/articles'
import type { SupportAccessSummary } from '@/lib/support/types'

export type ArticleAccessLevel = 'public' | 'pro' | 'premium'

export function resolveArticleAccessLevel(access: SupportAccessSummary | null): ArticleAccessLevel {
  if (!access?.hasActiveSubscription) return 'public'
  const slug = access.subscription?.plan?.slug ?? ''
  if (slug === 'enterprise-support') return 'premium'
  if (access.planTier === 'paid') return 'pro'
  return 'public'
}

const TIER_RANK: Record<EngineeringArticleTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
}

const ACCESS_RANK: Record<ArticleAccessLevel, number> = {
  public: 0,
  pro: 1,
  premium: 2,
}

export function canReadFullArticle(
  articleTier: EngineeringArticleTier,
  accessLevel: ArticleAccessLevel
): boolean {
  return ACCESS_RANK[accessLevel] >= TIER_RANK[articleTier]
}

export function articleLockReason(tier: EngineeringArticleTier): string {
  if (tier === 'pro') {
    return 'This article is for Pro subscribers. Upgrade to a paid Engineering Support plan to read the full post.'
  }
  return 'This article is for Premium subscribers. Upgrade to the Enterprise Support plan to read the full post.'
}
