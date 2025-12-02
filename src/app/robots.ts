import type { MetadataRoute } from 'next'

import { buildAbsoluteUrl, siteUrl } from '@/lib/siteMetadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: buildAbsoluteUrl('/sitemap.xml'),
    host: siteUrl,
  }
}
