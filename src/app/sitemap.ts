import type { MetadataRoute } from 'next'

import { buildAbsoluteUrl, siteUrl } from '@/lib/siteMetadata'

type StoreRecord = {
  id: string
  updatedAt?: unknown
}

function resolveLastModified(value: unknown): Date | undefined {
  if (!value) return undefined

  if (value instanceof Date) return value

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  if (typeof value === 'object' && value !== null) {
    const withToDate = value as { toDate?: () => Date }
    if (typeof withToDate.toDate === 'function') {
      try {
        return withToDate.toDate()
      } catch {
        return undefined
      }
    }
  }

  return undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const response = await fetch(await buildAbsoluteUrl('/api/stores'), {
      // Allow the sitemap to refresh periodically without revalidating on every request
      next: { revalidate: 60 * 60 },
    })

    if (!response.ok) {
      throw new Error(`Failed to load stores: ${response.status}`)
    }

    const payload = (await response.json()) as { stores: StoreRecord[] }

    const storeEntries: MetadataRoute.Sitemap = await Promise.all(
      payload.stores.map(async store => ({
        url: await buildAbsoluteUrl(`/stores/${store.id}`),
        lastModified: resolveLastModified(store.updatedAt) || undefined,
      })),
    )

    return [
      {
        url: `${siteUrl}/`,
      },
      ...storeEntries,
    ]
  } catch (error) {
    console.error('[sitemap] Unable to build sitemap', error)
    return [
      {
        url: `${siteUrl}/`,
      },
    ]
  }
}
