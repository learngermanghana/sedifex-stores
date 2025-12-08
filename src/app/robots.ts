import type { MetadataRoute } from 'next'

import { buildAbsoluteUrl, siteUrl } from '@/lib/siteMetadata'

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: await buildAbsoluteUrl('/sitemap.xml'),
    host: siteUrl,
  }
}
