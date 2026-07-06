import {
  ABOUT_DEFAULT,
  COMPANY,
  FOUNDER,
  MISSION_DEFAULT,
  PAYMENT,
} from '@/lib/company/constants'
import type { HeroContent } from '@/types/platform'

/** Keys stored in `site_settings` (key/value). */
export const SITE_SETTING_KEYS = [
  'company_legal_name',
  'company_brand_name',
  'company_platform_name',
  'company_email',
  'company_phone',
  'company_phone_display',
  'company_whatsapp',
  'company_address',
  'company_slogan',
  'company_tagline',
  'company_logo_url',
  'about_content',
  'mission_content',
  'payment_momo_code',
  'payment_account_name',
  'payment_workflow',
  'payment_method_label',
  'founder_name',
  'founder_title',
  'seo_title',
  'seo_description',
  'seo_keywords',
] as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number]

export type WebSettingsForm = {
  company_legal_name: string
  company_brand_name: string
  company_platform_name: string
  company_email: string
  company_phone: string
  company_phone_display: string
  company_whatsapp: string
  company_address: string
  company_slogan: string
  company_tagline: string
  company_logo_url: string
  about_content: string
  mission_content: string
  payment_momo_code: string
  payment_account_name: string
  payment_workflow: string
  payment_method_label: string
  founder_name: string
  founder_title: string
  seo_title: string
  seo_description: string
  seo_keywords: string
  hero: {
    id?: string
    title: string
    subtitle: string
    background_image: string
    cta_primary_label: string
    cta_primary_url: string
    cta_secondary_label: string
    cta_secondary_url: string
  }
}

export const DEFAULT_WEB_SETTINGS: WebSettingsForm = {
  company_legal_name: COMPANY.legalName,
  company_brand_name: COMPANY.brandName,
  company_platform_name: COMPANY.platformName,
  company_email: COMPANY.email,
  company_phone: COMPANY.phone,
  company_phone_display: COMPANY.phoneDisplay,
  company_whatsapp: COMPANY.whatsapp,
  company_address: COMPANY.address,
  company_slogan: COMPANY.slogan,
  company_tagline: COMPANY.tagline,
  company_logo_url: COMPANY.logoUrl,
  about_content: ABOUT_DEFAULT,
  mission_content: MISSION_DEFAULT,
  payment_momo_code: PAYMENT.momoPayCode,
  payment_account_name: PAYMENT.accountName,
  payment_workflow: PAYMENT.workflow,
  payment_method_label: PAYMENT.method,
  founder_name: FOUNDER.name,
  founder_title: FOUNDER.title,
  seo_title: `${COMPANY.brandName} — Engineering Training Rwanda`,
  seo_description: COMPANY.tagline,
  seo_keywords:
    'Energy and Logics, engineering training Rwanda, embedded systems, PLC, Kigali',
  hero: {
    title: `${COMPANY.brandName} — Engineering Training`,
    subtitle:
      'Hands-on programmes in embedded systems, industrial control, and advanced electrical technology. Based in Kigali, Rwanda.',
    background_image: '/hero-laboratory.jpg',
    cta_primary_label: 'View Programmes',
    cta_primary_url: '/learning',
    cta_secondary_label: 'About our founder',
    cta_secondary_url: '/about',
  },
}

export type PublicCompanyProfile = {
  legalName: string
  brandName: string
  platformName: string
  email: string
  phone: string
  phoneDisplay: string
  whatsapp: string
  address: string
  slogan: string
  tagline: string
  logoUrl: string
  about: string
  mission: string
  payment: {
    momoPayCode: string
    accountName: string
    workflow: string
    method: string
  }
  founder: { name: string; title: string }
  seo: { title: string; description: string; keywords: string }
}

export function mapSettingsToForm(
  rows: Record<string, string>,
  hero: HeroContent | null
): WebSettingsForm {
  const d = DEFAULT_WEB_SETTINGS
  return {
    company_legal_name: rows.company_legal_name ?? d.company_legal_name,
    company_brand_name: rows.company_brand_name ?? d.company_brand_name,
    company_platform_name: rows.company_platform_name ?? d.company_platform_name,
    company_email: rows.company_email ?? d.company_email,
    company_phone: rows.company_phone ?? d.company_phone,
    company_phone_display: rows.company_phone_display ?? d.company_phone_display,
    company_whatsapp: rows.company_whatsapp ?? d.company_whatsapp,
    company_address: rows.company_address ?? d.company_address,
    company_slogan: rows.company_slogan ?? d.company_slogan,
    company_tagline: rows.company_tagline ?? d.company_tagline,
    company_logo_url: rows.company_logo_url ?? d.company_logo_url,
    about_content: rows.about_content ?? d.about_content,
    mission_content: rows.mission_content ?? d.mission_content,
    payment_momo_code: rows.payment_momo_code ?? d.payment_momo_code,
    payment_account_name: rows.payment_account_name ?? d.payment_account_name,
    payment_workflow: rows.payment_workflow ?? d.payment_workflow,
    payment_method_label: rows.payment_method_label ?? d.payment_method_label,
    founder_name: rows.founder_name ?? d.founder_name,
    founder_title: rows.founder_title ?? d.founder_title,
    seo_title: rows.seo_title ?? d.seo_title,
    seo_description: rows.seo_description ?? d.seo_description,
    seo_keywords: rows.seo_keywords ?? d.seo_keywords,
    hero: {
      id: hero?.id,
      title: hero?.title ?? d.hero.title,
      subtitle: hero?.subtitle ?? d.hero.subtitle,
      background_image: hero?.background_image ?? d.hero.background_image,
      cta_primary_label: hero?.cta_primary_label ?? d.hero.cta_primary_label,
      cta_primary_url: hero?.cta_primary_url ?? d.hero.cta_primary_url,
      cta_secondary_label: hero?.cta_secondary_label ?? d.hero.cta_secondary_label,
      cta_secondary_url: hero?.cta_secondary_url ?? d.hero.cta_secondary_url,
    },
  }
}

export function toPublicCompanyProfile(form: WebSettingsForm): PublicCompanyProfile {
  return {
    legalName: form.company_legal_name,
    brandName: form.company_brand_name,
    platformName: form.company_platform_name,
    email: form.company_email,
    phone: form.company_phone,
    phoneDisplay: form.company_phone_display,
    whatsapp: form.company_whatsapp,
    address: form.company_address,
    slogan: form.company_slogan,
    tagline: form.company_tagline,
    logoUrl: form.company_logo_url,
    about: form.about_content,
    mission: form.mission_content,
    payment: {
      momoPayCode: form.payment_momo_code,
      accountName: form.payment_account_name,
      workflow: form.payment_workflow,
      method: form.payment_method_label,
    },
    founder: {
      name: form.founder_name,
      title: form.founder_title,
    },
    seo: {
      title: form.seo_title,
      description: form.seo_description,
      keywords: form.seo_keywords,
    },
  }
}
