const rawSiteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim()

export const siteUrl = rawSiteUrl.replace(/\/+$/, '')
export const siteName = 'Sedifex Stores'

export function buildAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${normalizedPath}`
}
