import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { COMPANY } from '@/lib/company/constants'
import './globals.css'

// Google fonts
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${COMPANY.brandName} | Engineering Training — Embedded Systems, PLC & Electrical`,
  description:
    'Energy & Logics Ltd delivers hands-on engineering training in embedded systems, industrial control, and advanced electrical technology from Kigali, Rwanda. MTN MoMo payments. Led by founder Elie Bisamaza.',
  keywords:
    'Energy and Logics, engineering training Rwanda, embedded systems, PLC, industrial automation, electrical technology, RTB, Kigali, East Africa, internship',
  authors: [{ name: COMPANY.legalName }],
  creator: COMPANY.legalName,
  publisher: COMPANY.legalName,
  robots: 'index, follow',
  icons: {
    icon: COMPANY.logoUrl,
    apple: COMPANY.logoUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_RW',
    url: 'https://energyandlogics.com',
    title: `${COMPANY.brandName} — Engineering Training Rwanda`,
    description:
      'Practical training in embedded systems, industrial control & electrical technology. Founded by Elie Bisamaza.',
    images: [
      {
        url: '/hero-laboratory.jpg',
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
