import { headers } from 'next/headers'

const rawSiteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim()

const normalizedFallbackSiteUrl = rawSiteUrl.replace(/\/+$/, '')

export const siteUrl = normalizedFallbackSiteUrl
export const siteName = 'Sedifex Stores'

function resolveRuntimeSiteUrl(): string {
  try {
    const headerList = headers()

    const host = headerList.get('host')
    if (!host) return normalizedFallbackSiteUrl

    const protocol = headerList.get('x-forwarded-proto') || 'https'
    return `${protocol}://${host}`.replace(/\/+$/, '')
  } catch {
    return normalizedFallbackSiteUrl
  }
}

export function buildAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const runtimeSiteUrl = resolveRuntimeSiteUrl()
  return `${runtimeSiteUrl}${normalizedPath}`
}
