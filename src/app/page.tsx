// app/page.tsx
import type { Metadata } from 'next'
import StoresPage from './StoresPage'

export const metadata: Metadata = {
  metadataBase: new URL('https://stores.sedifex.com'),
  title: 'Sedifex Stores Directory · Powered storefronts',
  description:
    'Browse public storefronts powered by Sedifex. Filter by region, contract status, and country to find the workspace you need.',
  keywords: [
    'Sedifex',
    'Sedifex stores',
    'POS',
    'inventory',
    'retail',
    'store directory',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sedifex Stores Directory',
    description:
      'Discover public stores powered by Sedifex across different countries and regions.',
    url: 'https://stores.sedifex.com/',
    siteName: 'Sedifex Stores',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sedifex Stores Directory',
    description:
      'Discover public stores powered by Sedifex across different countries and regions.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Page() {
  return <StoresPage />
}
