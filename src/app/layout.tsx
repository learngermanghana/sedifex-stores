// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sedifex store directory',
  description:
    'Browse businesses powered by Sedifex. View their location and contact details, then reach out directly to order or visit in person.',
  openGraph: {
    title: 'Sedifex store directory',
    description:
      'Discover retail stores, pharmacies, restaurants, and more that run on Sedifex POS.',
    type: 'website',
    url: 'https://stores.sedifex.com', // or your final domain when ready
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
