// app/page.tsx
import type { Metadata } from 'next'
import StoresPage from './StoresPage'

import { siteName, siteUrl } from '@/lib/siteMetadata'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteName} Directory · Powered storefronts`,
  description:
    'Browse public storefronts powered by Sedifex. Filter by region and country to find the workspace you need.',
  keywords: [
    'Sedifex',
    'Sedifex stores',
    'POS',
    'inventory',
    'retail',
    'store directory',
    'storefronts',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${siteName} Directory`,
    description:
      'Discover public stores powered by Sedifex across different countries and regions.',
    url: `${siteUrl}/`,
    siteName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} Directory`,
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
