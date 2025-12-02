import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import styles from '../../../page.module.css'

type StoreProduct = {
  id: string
  title: string | null
  category: string | null
  description: string | null
  price: number | null
  currency: string | null
  sku: string | null
  stockCount: number | null
}

type StoreRecord = {
  id: string
  name: string | null
  displayName: string | null
  email: string | null
  phone: string | null
  whatsAppPhone?: string | null
  addressLine1: string | null
  city: string | null
  region: string | null
  country: string | null
  publicDescription: string | null
  products: StoreProduct[]
}

function formatLocation(store: StoreRecord) {
  return [
    store.addressLine1,
    store.city,
    store.region,
    store.country,
  ]
    .filter(Boolean)
    .join(', ')
}

function formatPrice(product: StoreProduct): string | null {
  if (product.price == null && !product.currency) return null
  const currency = (product.currency || '').toUpperCase()
  if (!currency || currency.length !== 3) {
    return product.price != null ? `${product.price}` : null
  }
  if (product.price == null) return currency
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(product.price)
  } catch {
    return `${currency} ${product.price}`
  }
}

async function fetchStore(id: string): Promise<StoreRecord> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/stores`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to load stores')
  }

  const payload = (await res.json()) as { stores: StoreRecord[] }
  const store = payload.stores.find(s => s.id === id)

  if (!store) notFound()
  return store
}

// --- SEO metadata for each store page ---

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const store = await fetchStore(params.id)
  const title =
    (store.displayName || store.name || 'Store') + ' · Sedifex Storefront'
  const description =
    store.publicDescription ||
    `Discover ${store.displayName || store.name} on Sedifex.`

  return {
    title,
    description,
    alternates: {
      canonical: `/stores/${params.id}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

// --- Page ---

export default async function StorePage({
  params,
}: {
  params: { id: string }
}) {
  const store = await fetchStore(params.id)
  const title = store.displayName || store.name || 'Store'
  const location = formatLocation(store)

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>Sedifex Storefront</span>
            <h1 className={styles.heroTitle}>{title}</h1>
            <p className={styles.heroLead}>
              Powered by Sedifex. Contact the store directly to buy –
              we don&apos;t take a cut.
            </p>
            {location && (
              <p className={styles.cardSubtitle}>{location}</p>
            )}
          </div>
        </section>

        <section className={styles.layout}>
          <div className={styles.listPanel}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Contact</h2>

              <dl className={styles.meta}>
                {store.phone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      <a href={`tel:${store.phone}`}>{store.phone}</a>
                    </dd>
                  </div>
                )}
                {store.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${store.email}`}>{store.email}</a>
                    </dd>
                  </div>
                )}
              </dl>

              <p className={styles.cardFooterText}>
                Powered by Sedifex ·{' '}
                <a href="/">Back to all stores</a>
              </p>
            </div>

            {store.products.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Products</h2>
                <ul className={styles.productList}>
                  {store.products.map(p => {
                    const price = formatPrice(p)
                    return (
                      <li key={p.id} className={styles.productItem}>
                        <div className={styles.productTitleRow}>
                          <p className={styles.productTitle}>
                            {p.title || 'Listing'}
                          </p>
                          {p.category && (
                            <span className={styles.productBadge}>
                              {p.category}
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <p className={styles.productDescription}>
                            {p.description}
                          </p>
                        )}
                        {(p.sku || p.stockCount != null) && (
                          <p className={styles.productDescription}>
                            {p.sku && <span>SKU: {p.sku}</span>}
                            {p.sku && p.stockCount != null && ' · '}
                            {p.stockCount != null && (
                              <span>In stock: {p.stockCount}</span>
                            )}
                          </p>
                        )}
                        {price && (
                          <p className={styles.productPrice}>{price}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
