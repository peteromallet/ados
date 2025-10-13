import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Log environment at build time
console.log('🔧 Layout - NEXT_PUBLIC_APP_URL at build/load:', process.env.NEXT_PUBLIC_APP_URL)

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'ADOS - Los Angeles | November 7th',
  description: 'A celebration of art and open-source AI',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ADOS - Los Angeles | November 7th',
    description: 'A celebration of art and open-source AI',
    url: 'https://ados.events',
    siteName: 'ADOS',
    images: [
      {
        url: '/bg_poster.jpg',
        width: 1200,
        height: 630,
        alt: 'ADOS Event',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADOS - Los Angeles | November 7th',
    description: 'A celebration of art and open-source AI',
    images: ['/bg_poster.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.8" />
        <link rel="icon" type="image/png" href="/icon.png" sizes="512x512" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={inter.className}>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}

