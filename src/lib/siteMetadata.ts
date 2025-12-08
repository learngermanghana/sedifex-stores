import { headers } from 'next/headers'

const rawSiteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim()

const normalizedFallbackSiteUrl = rawSiteUrl.replace(/\/+$/, '')

export const siteUrl = normalizedFallbackSiteUrl
export const siteName = 'Sedifex Stores'

async function resolveRuntimeSiteUrl(): Promise<string> {
  try {
    const headerList = await headers()

    const host = headerList.get('host')
    if (!host) return normalizedFallbackSiteUrl

    const protocol = headerList.get('x-forwarded-proto') || 'https'
    return `${protocol}://${host}`.replace(/\/+$/, '')
  } catch {
    return normalizedFallbackSiteUrl
  }
}

export async function buildAbsoluteUrl(path: string): Promise<string> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const runtimeSiteUrl = await resolveRuntimeSiteUrl()
  return `${runtimeSiteUrl}${normalizedPath}`
}
