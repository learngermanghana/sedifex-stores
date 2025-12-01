'use client'

import React, { useEffect, useMemo, useState } from 'react'
import styles from './page.module.css'

const PAGE_SIZE = 24
const SKELETON_CARD_COUNT = 6

// ---------- Types / helpers ----------

type StoreRecord = {
  id: string
  name: string | null
  displayName: string | null
  email: string | null
  phone: string | null
  status: string | null
  contractStatus: string | null
  addressLine1: string | null
  city: string | null
  region: string | null
  country: string | null
  publicDescription: string | null
  createdAt: Date | null
  updatedAt: Date | null
  latitude: number | null
  longitude: number | null
  products: StoreProduct[]
}

type StoreProduct = {
  id: string
  title: string | null
  category: string | null
  description: string | null
  price: number | null
  currency: string | null
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null) {
    const withToDate = value as { toDate?: () => Date }
    if (typeof withToDate.toDate === 'function') {
      try {
        return withToDate.toDate()
      } catch {
        return null
      }
    }
  }
  if (value instanceof Date) return value
  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function mapStore(data: Record<string, unknown>, id: string): StoreRecord {
  return {
    id,
    name: toNullableString(data.name),
    displayName: toNullableString(data.displayName),
    email: toNullableString(data.email),
    phone: toNullableString(data.phone),
    status: toNullableString(data.status),
    contractStatus: toNullableString(data.contractStatus),
    addressLine1: toNullableString(data.addressLine1),
    city: toNullableString(data.city),
    region: toNullableString(data.region),
    country: toNullableString(data.country),
    publicDescription: toNullableString(data.publicDescription),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    latitude: toNumber(data.latitude),
    longitude: toNumber(data.longitude),
    products: Array.isArray(data.products)
      ? (data.products as Record<string, unknown>[]).map((product, index) =>
          mapProduct(product, (product as { id?: string }).id || `${id}-item-${index}`),
        )
      : [],
  }
}

function mapProduct(data: Record<string, unknown>, id: string): StoreProduct {
  return {
    id,
    title: toNullableString(data.title) || toNullableString(data.name),
    category: toNullableString(data.category) || toNullableString(data.type),
    description: toNullableString(data.description),
    price: toNumber(data.price),
    currency: toNullableString(data.currency),
  }
}

function formatLocation(store: StoreRecord): string {
  const locationParts = [
    store.addressLine1,
    store.city,
    store.region,
    store.country,
  ].filter(Boolean)
  return locationParts.join(', ')
}

function formatPrice(product: StoreProduct): string | null {
  if (product.price === null && !product.currency) return null

  const currency = (product.currency || 'USD').toUpperCase()
  const normalisedCurrency = currency.length === 3 ? currency : 'USD'

  if (product.price === null) return normalisedCurrency

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalisedCurrency,
      maximumFractionDigits: 2,
    }).format(product.price)
  } catch {
    return `${normalisedCurrency} ${product.price}`
  }
}

function buildOptions(values: (string | null)[]) {
  const entries = new Map<string, string>()
  values.forEach(value => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (!entries.has(key)) entries.set(key, trimmed)
  })

  return Array.from(entries.entries())
    .sort(([, labelA], [, labelB]) => labelA.localeCompare(labelB))
    .map(([value, label]) => ({ value, label }))
}

// ---------- UI components ----------

function StoreCard({ store }: { store: StoreRecord }) {
  const title = store.displayName || store.name || 'Store'
  const location = formatLocation(store)
  const [copied, setCopied] = useState(false)

  // 🔗 Build public store URL from Firestore doc id
  const storeUrl = `https://stores.sedifex.com/store/${store.id}`

  const featuredProducts = store.products.slice(0, 3)

  const handleCall = () => {
    if (!store.phone) return
    window.location.href = `tel:${store.phone}`
  }

  const handleEmail = () => {
    if (!store.email) return
    window.location.href = `mailto:${store.email}`
  }

  const handleCopyAddress = async () => {
    if (!location) return

    try {
      await navigator.clipboard.writeText(location)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <p className={styles.cardEyebrow}>Store</p>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardSubtitle}>
          {location || 'Location coming soon'}
        </p>
      </header>

      {store.publicDescription && (
        <p className={styles.cardDescription}>{store.publicDescription}</p>
      )}

      {featuredProducts.length > 0 && (
        <div className={styles.productPanel}>
          <div className={styles.productHeader}>
            <p className={styles.cardEyebrow}>Featured offerings</p>
            <span className={styles.productCount}>
              {featuredProducts.length} item{featuredProducts.length === 1 ? '' : 's'}
            </span>
          </div>

          <ul className={styles.productList}>
            {featuredProducts.map(product => {
              const priceLabel = formatPrice(product)
              return (
                <li key={product.id} className={styles.productItem}>
                  <div className={styles.productTitleRow}>
                    <p className={styles.productTitle}>
                      {product.title || 'Listing'}
                    </p>
                    {product.category && (
                      <span className={styles.productBadge}>{product.category}</span>
                    )}
                  </div>
                  {product.description && (
                    <p className={styles.productDescription}>{product.description}</p>
                  )}
                  {priceLabel && (
                    <p className={styles.productPrice}>{priceLabel}</p>
                  )}
                </li>
              )
            })}
          </ul>

          <p className={styles.productHint}>
            Chat, call, or email the store directly to learn more—online checkout is
            disabled.
          </p>
        </div>
      )}

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

      <div className={styles.cardFooter}>
        <div className={styles.contactLinks}>
          {store.phone && (
            <a className={styles.contactLink} href={`tel:${store.phone}`}>
              {store.phone}
            </a>
          )}
          {store.email && (
            <a className={styles.contactLink} href={`mailto:${store.email}`}>
              {store.email}
            </a>
          )}
        </div>

        <div className={styles.quickActions}>
          <button
            className={styles.actionButton}
            type="button"
            onClick={handleCall}
            disabled={!store.phone}
            aria-label={store.phone ? `Call ${store.phone}` : 'Phone unavailable'}
          >
            Call
          </button>
          <button
            className={styles.actionButton}
            type="button"
            onClick={handleEmail}
            disabled={!store.email}
            aria-label={store.email ? `Email ${store.email}` : 'Email unavailable'}
          >
            Email
          </button>
          <button
            className={styles.actionButton}
            type="button"
            onClick={handleCopyAddress}
            disabled={!location}
            aria-label={location ? `Copy ${location}` : 'Address unavailable'}
          >
            {copied ? 'Copied' : 'Copy address'}
          </button>
        </div>
      </div>

      <p className={styles.cardFooterText}>Powered by Sedifex</p>

      <div className={styles.cardActions}>
        <a
          className={styles.secondaryButton}
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`View details for ${title}`}
        >
          View details
        </a>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className={styles.cardSkeleton} aria-hidden="true">
      <div className={styles.skeletonEyebrow} />
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonSubtitle} />
      <div className={styles.skeletonMeta}>
        <div />
        <div />
        <div />
      </div>
      <div className={styles.skeletonFooter} />
    </div>
  )
}

function SkeletonMap() {
  return (
    <div className={styles.mapSection} aria-hidden="true">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.kicker}>Live coverage</p>
          <h2 className={styles.mapTitle}>Global Store Footprint</h2>
          <p className={styles.mapSubtitle}>
            Visualizing your public Sedifex workspaces on a globe.
          </p>
        </div>
        <span className={styles.skeletonPill} />
      </div>

      <div className={`${styles.mapCanvas} ${styles.mapSkeleton}`}>
        <div className={styles.mapSkeletonDot} />
        <div className={styles.mapSkeletonDot} />
        <div className={styles.mapSkeletonDot} />
      </div>
    </div>
  )
}

function hasCoordinates(store: StoreRecord): store is StoreRecord & {
  latitude: number
  longitude: number
} {
  return (
    typeof store.latitude === 'number' &&
    typeof store.longitude === 'number' &&
    Number.isFinite(store.latitude) &&
    Number.isFinite(store.longitude)
  )
}

function projectCoordinates(latitude: number, longitude: number) {
  const x = ((longitude + 180) / 360) * 100
  const y = ((90 - latitude) / 180) * 100

  const clamp = (value: number) => Math.min(97, Math.max(3, value))
  return { x: clamp(x), y: clamp(y) }
}

type ProjectedPin = {
  store: StoreRecord
  location: string
  x: number
  y: number
}

function clusterPins(pins: ProjectedPin[], threshold = 4) {
  const clusters: Array<{
    id: string
    x: number
    y: number
    pins: ProjectedPin[]
  }> = []

  pins.forEach(pin => {
    const existing = clusters.find(cluster => {
      const dx = cluster.x - pin.x
      const dy = cluster.y - pin.y
      return Math.hypot(dx, dy) <= threshold
    })

    if (existing) {
      const count = existing.pins.length
      existing.x = (existing.x * count + pin.x) / (count + 1)
      existing.y = (existing.y * count + pin.y) / (count + 1)
      existing.pins.push(pin)
      return
    }

    clusters.push({
      id: `cluster-${clusters.length}-${pin.store.id}`,
      x: pin.x,
      y: pin.y,
      pins: [pin],
    })
  })

  return clusters
}

function StoreMap({ stores }: { stores: StoreRecord[] }) {
  const pins = stores
    .map(store => ({
      store,
      location: formatLocation(store),
    }))
    .filter(entry => entry.location && hasCoordinates(entry.store))
    .map(entry => ({
      ...entry,
      projected: projectCoordinates(
        entry.store.latitude as number,
        entry.store.longitude as number,
      ),
    }))

  const clusters = clusterPins(
    pins.map(pin => ({
      store: pin.store,
      location: pin.location as string,
      x: pin.projected.x,
      y: pin.projected.y,
    })),
  )

  return (
    <section className={styles.mapSection} aria-label="Store locations">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.kicker}>Map</p>
          <h2 className={styles.mapTitle}>Where you’ll find these stores</h2>
          <p className={styles.mapSubtitle}>
            Pins are now geocoded using the store’s address, projected to
            latitude/longitude coordinates, and clustered when locations are
            close together.
          </p>
        </div>
        <span className={styles.resultCount} aria-live="polite">
          {clusters.length} pin{clusters.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className={styles.mapCanvas} role="img" aria-label="Store map">
        {clusters.length === 0 && (
          <p className={styles.muted}>Add a location to see pins on the map.</p>
        )}

        {clusters.map(cluster => {
          const count = cluster.pins.length
          const [{ store, location }] = cluster.pins
          const title = store.displayName || store.name || 'Store'
          const ariaLabel =
            count > 1
              ? `${count} stores near ${location}`
              : `${title} near ${location}`

          const handleClick = () => {
            if (count === 1) {
              const url = `https://stores.sedifex.com/store/${store.id}`
              window.open(url, '_blank', 'noreferrer')
            }
          }

          return (
            <button
              key={cluster.id}
              type="button"
              className={`${styles.mapPin} ${count > 1 ? styles.clusterPin : ''}`}
              style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
              title={ariaLabel}
              aria-label={ariaLabel}
              onClick={count === 1 ? handleClick : undefined}
            >
              <span
                className={`${styles.pinDot} ${
                  count > 1 ? styles.clusterDot : ''
                }`}
                aria-hidden
              >
                {count > 1 ? count : null}
              </span>
              <div className={styles.pinLabel}>
                <strong>{count > 1 ? `${count} stores` : title}</strong>
                <span>
                  {count > 1
                    ? cluster.pins
                        .slice(0, 3)
                        .map(pin => formatLocation(pin.store))
                        .filter(Boolean)
                        .join(' · ')
                    : location}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ---------- Page ----------

export default function StoresPage() {
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function loadStores() {
      setError(null)
      setLoading(true)
      try {
        const response = await fetch('/api/stores')
        if (!response.ok) {
          throw new Error('Unable to load stores right now. Please retry.')
        }

        const payload = (await response.json()) as {
          stores?: Record<string, unknown>[]
          error?: string
        }

        if (cancelled) return

        if (!payload.stores) {
          throw new Error(
            payload.error || 'Unable to load stores right now. Please retry.',
          )
        }

        const results = payload.stores.map(item =>
          mapStore(item, (item as { id?: string }).id || 'unknown'),
        )
        setStores(results)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load stores right now. Please retry.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStores()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, countryFilter])

  const filteredStores = useMemo(() => {
    const queryText = searchTerm.trim().toLowerCase()

    return stores.filter(store => {
      const matchesSearch = queryText
        ? [
            store.displayName,
            store.name,
            store.city,
            store.country,
            store.publicDescription,
          ]
            .filter(Boolean)
            .some(value => (value as string).toLowerCase().includes(queryText))
        : true

      const matchesCountry = countryFilter
        ? (store.country || '').toLowerCase() === countryFilter
        : true

      return matchesSearch && matchesCountry
    })
  }, [stores, searchTerm, countryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE))
  const paginatedStores = filteredStores.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const countryOptions = buildOptions(stores.map(store => store.country))

  const activeCount = filteredStores.filter(store =>
    (store.contractStatus || store.status || '').toLowerCase().includes('active'),
  ).length
  const countryCount = new Set(
    filteredStores.map(store => (store.country || '').toLowerCase()).filter(Boolean),
  ).size

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>Sedifex Atlas</span>
            <h1 className={styles.heroTitle}>Discover partnered storefronts</h1>
            <p className={styles.heroLead}>
              See every public store powered by Sedifex with a cleaner, more
              curated browsing experience. Filter by region or search by name
              to find the workspace you need.
            </p>
            <div className={styles.heroPills}>
              <span className={styles.pill}>Real-time feed</span>
              <span className={styles.pill}>Curated map pins</span>
              <span className={styles.pill}>Helpful details in one tap</span>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Live stores</p>
              <p className={styles.statValue}>{stores.length}</p>
              <p className={styles.statHint}>Synced from Firestore</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>In view</p>
              <p className={styles.statValue}>{filteredStores.length}</p>
              <p className={styles.statHint}>Respecting your filters</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Active partners</p>
              <p className={styles.statValue}>{activeCount}</p>
              <p className={styles.statHint}>Marked as active</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Countries</p>
              <p className={styles.statValue}>{countryCount}</p>
              <p className={styles.statHint}>Visible in this view</p>
            </div>
          </div>
        </section>

        <section className={styles.toolbar}>
          <div className={styles.toolbarRow}>
            <div className={styles.searchField}>
              <label htmlFor="search">Search stores</label>
              <input
                id="search"
                name="search"
                type="search"
                placeholder="Search by name, description, or city"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
            </div>
            <div className={styles.quickMeta}>
              <p className={styles.resultCount}>
                Showing {filteredStores.length} of {stores.length} stores
              </p>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          </div>

          <div className={styles.toolbarRow}>
            <div className={styles.filters}>
              <div className={styles.selectField}>
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  value={countryFilter}
                  onChange={event => setCountryFilter(event.target.value)}
                >
                  <option value="">Anywhere</option>
                  {countryOptions.map(option => (
                    <option key={option.value} value={option.value.toLowerCase()}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.pagination} aria-label="Pagination">
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className={styles.muted}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className={styles.layout}>
          <div className={styles.listPanel}>
            <div
              className={`${styles.grid} ${loading ? styles.gridSkeleton : ''}`}
            >
              {loading &&
                Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}

              {!loading && paginatedStores.length === 0 && (
                <div className={styles.emptyCard}>
                  <div className={styles.emptyIcon} />
                  <div>
                    <h3 className={styles.emptyTitle}>No stores match this view</h3>
                    <p className={styles.emptyCopy}>
                      Adjust your filters or clear the search to see more partners.
                      We’ll keep the canvas fresh as new stores go live.
                    </p>
                  </div>
                </div>
              )}

              {!loading &&
                paginatedStores.map(store => (
                  <StoreCard key={store.id} store={store} />
                ))}
            </div>

            <div className={styles.listFooter}>
              <p className={styles.muted}>
                {paginatedStores.length} result
                {paginatedStores.length === 1 ? '' : 's'} on this page
              </p>
              <div className={styles.pagination} aria-label="Pagination">
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className={styles.muted}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {loading ? <SkeletonMap /> : <StoreMap stores={filteredStores} />}
        </section>
      </div>
    </main>
  )
}
