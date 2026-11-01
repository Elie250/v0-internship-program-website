import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { AnalyticsBeacon } from '@/components/privacy/analytics-beacon'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const profile = await loadPublicCompanyProfile()
  return {
    title: profile.seo.title,
    description: profile.seo.description,
    keywords: profile.seo.keywords,
    authors: [{ name: profile.legalName }],
    creator: profile.legalName,
    publisher: profile.legalName,
    robots: 'index, follow',
    icons: {
      icon: profile.logoUrl,
      apple: profile.logoUrl,
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: profile.legalName,
    },
    openGraph: {
      type: 'website',
      locale: 'en_RW',
      url: 'https://energyandlogics.com',
      title: profile.seo.title,
      description: profile.seo.description,
      images: [{ url: '/hero-laboratory.jpg', width: 1920, height: 600 }],
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${inter.className} antialiased`}>
        {children}
        <PwaRegister />
        <Suspense fallback={null}>
          <AnalyticsBeacon />
        </Suspense>
      </body>
    </html>
  )
}
