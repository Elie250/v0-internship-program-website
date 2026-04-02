import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Import AuthProvider
import { AuthProvider } from '../contexts/AuthContext'
// Import global components
import Navbar from '../components/Navbar'  // correct if file is app/components/Navbar.tsx
import Footer from '../components/Footer'
// Google fonts
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Energy & Logics - Engineering Hub | Training, Internships & Services',
  description:
    'Leading engineering hub offering embedded systems training, IoT solutions, industrial automation, and engineering services. Join our webinars, internships, and professional training programs.',
  keywords:
    'engineering hub, embedded systems, IoT solutions, industrial automation, PLC training, internship programs, webinars, engineering consulting',
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
    title: 'Energy & Logics Engineering Hub',
    description: 'Training, internships, and professional engineering services',
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
