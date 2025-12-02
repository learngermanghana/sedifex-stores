// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

import { siteName, siteUrl } from '@/lib/siteMetadata'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteName} directory`,
  description:
    'Browse businesses powered by Sedifex. View their location and contact details, then reach out directly to order or visit in person.',
  openGraph: {
    title: `${siteName} directory`,
    description:
      'Discover retail stores, pharmacies, restaurants, and more that run on Sedifex POS.',
    type: 'website',
    url: siteUrl,
    siteName,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: '#f3f4f6', // light gray background
          color: '#111827',
        }}
      >
        {children}
      </body>
    </html>
  )
}
