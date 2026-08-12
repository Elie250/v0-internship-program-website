export function getRecruitmentPublicUrl(): string {
  const url =
    process.env.RECRUITMENT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_RECRUITMENT_URL?.trim() ||
    'https://jobs.energyandlogics.com'
  return url.replace(/\/$/, '')
}
