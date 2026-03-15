import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Import AuthProvider
import { AuthProvider } from '../contexts/AuthContext'
// Import global components
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Google fonts
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Energy & Logics Engineering Academy - Professional Internship Programs',
  description:
    'Master Electrical Systems, Embedded Technology, IoT Solutions, and Electronics through hands-on internship programs. Industry-expert training in Kigali, Rwanda.',
  keywords:
    'engineering internship, electrical systems, embedded systems, IoT, automation, PLC, electronics, training, Kigali, Rwanda',
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
    <AuthProvider>
      <html lang="en">
        <body className={`${_geist.className} font-sans antialiased`}>
          {/* Navbar */}
          <Navbar />
          {/* Main content */}
          {children}
          {/* Footer */}
          <Footer />
          <Analytics />
        </body>
      </html>
    </AuthProvider>
  )
}