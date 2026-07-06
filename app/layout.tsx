import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'
import './globals.css'

// Google fonts
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

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
      <body className={`${_geist.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
