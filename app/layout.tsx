import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Google fonts
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Engineering Hub | Energy & Logics — Multi-Portal Engineering Ecosystem',
  description: 'Engineering education, career development, technical support, internships, and marketplace. Dynamic platform powered by Energy & Logics.',
  keywords: 'engineering internship, electrical systems, embedded systems, IoT, automation, PLC, electronics, training, Kigali, Rwanda',
  authors: [{ name: 'Energy & Logics Ltd' }],
  creator: 'Energy & Logics Ltd',
  publisher: 'Energy & Logics Ltd',
  robots: 'index, follow',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://energyandlogics.com',
    title: 'Energy & Logics Engineering Academy',
    description: 'Professional internship programs in engineering disciplines',
    images: [
      {
        url: '/hero-banner.jpg',
        width: 1920,
        height: 600,
      },
    ],
  },
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
