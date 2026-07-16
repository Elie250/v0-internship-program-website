import { COMPANY, PAYMENT } from '@/lib/company/constants'

export const LEGAL_LAST_UPDATED = '16 July 2026'

export const privacyPolicySections = [
  {
    title: '1. Who we are',
    body: `${COMPANY.legalName} ("${COMPANY.brandName}", "we", "us") operates the ${COMPANY.platformName} platform at ${COMPANY.publicSiteUrl}. We provide engineering training, technical support, and related digital services from ${COMPANY.address}.`,
  },
  {
    title: '2. Information we collect',
    body: `We may collect: account details (name, email, phone, password hash); enrollment and application data; payment references and receipt uploads; support ticket content; course progress and attendance; device and usage data (IP address, browser, pages visited); and communications you send to us (email, WhatsApp, contact forms).`,
  },
  {
    title: '3. How we use your information',
    body: `We use personal data to: create and manage your account; process enrollments and payments; deliver courses, webinars, and support services; verify MoMo receipts and card payments; issue certificates; send service emails and reminders; improve our platform; comply with law; and protect against fraud or abuse.`,
  },
  {
    title: '4. Payment data',
    body: `MTN MoMo manual payments are verified using receipts you upload. We do not store full card numbers on our servers. We store transaction references, amounts, and approval status.`,
  },
  {
    title: '5. Legal basis & consent',
    body: `We process data to perform our contract with you (enrollment, support plans), with your consent where required (for example marketing emails you opt into), and for legitimate interests including security, fraud prevention, and understanding how the platform is used so we can improve training and tools. Analytics practices are described in section 10. Contact ${COMPANY.email} if you have questions about your data.`,
  },
  {
    title: '6. Sharing with third parties',
    body: `We may share data with: Supabase (database hosting for the platform and first-party analytics rollups); Vercel (application hosting); Cloudflare (DNS/CDN and optional Web Analytics if enabled); Resend (transactional email); and authorities when required by law. We do not sell your personal data or use it for third-party advertising.`,
  },
  {
    title: '7. Data retention',
    body: `We retain account and enrollment records while your relationship with us continues and for a reasonable period afterward for certificates, tax, and dispute resolution. Payment records are kept as required for accounting and audit.`,
  },
  {
    title: '8. Security',
    body: `We use industry-standard measures including encrypted connections (HTTPS), access controls, and role-based admin permissions. No method of transmission over the Internet is 100% secure; please use a strong password and keep login details confidential.`,
  },
  {
    title: '9. Your rights',
    body: `You may request access, correction, or deletion of your personal data where applicable under Rwandan law and our internal policies. Contact us at ${COMPANY.email} to exercise these rights. You may also deactivate your account by contacting support.`,
  },
  {
    title: '10. Cookies & analytics',
    body: `We use cookies and similar browser storage for two purposes.

Essential (login & site operation): session cookies / storage keep you signed in, protect forms, and remember settings needed for the service to work.

Visitor analytics (first-party, for our Admin team only): when you use the site we also collect lightweight usage information so we can improve programmes, Tools, and Brain Training. We do not show a cookie popup for this. Instead we disclose it here.

What we collect for analytics: a random visitor identifier stored in your browser (not your name or password); pages viewed in broad groups (for example Home, Learning, Shop, Brain Training — not every personal message); whether you arrived via Instagram, Facebook, Google/search, direct visit, or another site (from the browser referrer or campaign links such as utm_source); and which Brain Training games are opened or completed. If you are logged in and save a game score, that score is stored on your account as part of the training feature.

How we use it: only to count visitors, popular pages, traffic sources, and which games people use, inside our Admin dashboards. We use this to decide what to improve. We do not sell this data, do not use it for advertising networks, and do not use it to hack or scam anyone.

Where it is stored: on our infrastructure (for example Supabase database rollups hosted with our application). Optional Cloudflare Web Analytics may also measure traffic in a privacy-friendly way if enabled on our domain.

Browser controls: you can clear cookies/site data for this domain in your browser settings, or use private browsing. Blocking storage may reduce analytics accuracy but should not prevent normal browsing of public pages.`,
  },
  {
    title: '11. Children',
    body: `Our services are intended for students and professionals. If you believe a child under 16 has registered without appropriate consent, contact us and we will take appropriate action.`,
  },
  {
    title: '12. Changes & contact',
    body: `We may update this Privacy Policy from time to time. The "Last updated" date at the top will change when we do. Questions: ${COMPANY.email} · ${COMPANY.phoneDisplay} · ${COMPANY.address}.`,
  },
]

export const termsSections = [
  {
    title: '1. Agreement',
    body: `By accessing ${COMPANY.publicSiteUrl}, creating an account, enrolling in a programme, purchasing from our shop, or subscribing to engineering support, you agree to these Terms & Conditions and our Privacy Policy.`,
  },
  {
    title: '2. Services',
    body: `${COMPANY.brandName} provides online and blended engineering training, webinars, shop products, career/internship information, and paid engineering support plans through the ${COMPANY.platformName} platform. Content and schedules may be updated to improve quality.`,
  },
  {
    title: '3. Accounts',
    body: `You must provide accurate registration information and keep credentials secure. Staff roles (lecturer, engineer) require admin approval. You are responsible for activity under your account. We may suspend accounts that violate these terms or misuse the platform.`,
  },
  {
    title: '4. Enrollments & access',
    body: `Paid programmes require successful MoMo receipt verification. Free programmes may grant instant access. Access periods, cohort limits, and drip-release rules are defined per programme. Sharing login credentials or course materials without permission is prohibited.`,
  },
  {
    title: '5. Payments',
    body: `Prices are shown in Rwandan Francs (RWF) unless stated otherwise. MTN MoMo manual payments use Pay Code ${PAYMENT.momoPayCode} to ${COMPANY.legalName}. Failed or disputed payments do not grant access until resolved.`,
  },
  {
    title: '6. Refunds',
    body: `Refund eligibility is described in our Refund Policy. Generally, verified digital access and completed sessions may not be refundable. Duplicate charges and technical errors will be corrected. Contact ${COMPANY.email} within 7 days of payment for refund requests.`,
  },
  {
    title: '7. Intellectual property',
    body: `Course materials, branding, logos, and platform software are owned by ${COMPANY.legalName} or its licensors. You receive a limited, non-transferable licence for personal learning. Redistribution, recording for resale, or scraping content is not allowed without written permission.`,
  },
  {
    title: '8. Certificates',
    body: `Certificates are issued after meeting programme requirements and admin approval where applicable. Certificates include verification links and codes. Misrepresentation of credentials or tampering with certificates is prohibited and may result in revocation.`,
  },
  {
    title: '9. Conduct',
    body: `You agree not to harass staff or learners, upload malware, attempt unauthorized access, or use the platform for unlawful purposes. We may remove content and terminate access for violations.`,
  },
  {
    title: '10. Disclaimers',
    body: `Training is provided for educational purposes. We do not guarantee employment outcomes. The platform is provided "as is" with reasonable care; we are not liable for indirect damages to the extent permitted by applicable law.`,
  },
  {
    title: '11. Governing law',
    body: `These terms are governed by the laws of the Republic of Rwanda. Disputes should first be raised with us at ${COMPANY.email}; we will attempt good-faith resolution before other remedies.`,
  },
  {
    title: '12. Changes',
    body: `We may update these Terms. Continued use after updates constitutes acceptance. Material changes will be reflected by updating the date below.`,
  },
]

export const refundPolicySections = [
  {
    title: '1. Overview',
    body: `${COMPANY.brandName} offers both free and paid programmes. This Refund Policy explains when refunds may apply for MoMo payments.`,
  },
  {
    title: '2. MTN MoMo (manual verification)',
    body: `If your receipt was rejected in error, re-submit a clear screenshot or contact support. If you paid the wrong amount, we will work with you to top up or refund the difference at our discretion. Refunds for MoMo are sent back to the same number when approved.`,
  },
  {
    title: '3. Before programme start',
    body: `If you cancel at least 48 hours before the official programme start date and have not accessed paid materials, you may request a full refund within 7 days of payment.`,
  },
  {
    title: '4. Shop orders',
    body: `Physical or digital shop products follow separate fulfilment terms communicated at checkout. Defective or undelivered items may be replaced or refunded after investigation.`,
  },
  {
    title: '5. How to request',
    body: `Email ${COMPANY.email} with your name, payment reference, programme or order details, and reason. We respond within 3–5 business days.`,
  },
]
