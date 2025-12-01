'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
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
  status: string | null          // internal only, not rendered
  contractStatus: string | null  // internal only, not rendered
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
  sku: string | null
  stockCount: number | null
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
          mapProduct(
            product,
            (product as { id?: string }).id || `${id}-item-${index}`,
          ),
        )
      : [],
  }
}

function mapProduct(data: Record<string, unknown>, id: string): StoreProduct {
  return {
    id,
    title: toNullableString(data.name) || toNullableString(data.title),
    category: toNullableString(data.itemType) || toNullableString(data.category),
    description: toNullableString(data.description),
    price: toNumber(data.price),
    currency: toNullableString(data.currency),
    sku: toNullableString(data.sku),
    stockCount: toNumber(data.stockCount),
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
  if (product.price == null && !product.currency) return null

  const currency = (product.currency || '').toUpperCase()

  // If we don't have a valid 3-letter code, just show the number
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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
} as const

// ---------- UI components ----------

function StoreCard({ store }: { store: StoreRecord }) {
  const title = store.displayName || store.name || 'Store'
  const location = formatLocation(store)
  const [copied, setCopied] = useState(false)

  // Use /stores/[id] so it matches your route
  const storeUrl = `/stores/${store.id}`

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
              {featuredProducts.length} item
              {featuredProducts.length === 1 ? '' : 's'}
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
                      <span className={styles.productBadge}>
                        {product.category}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className={styles.productDescription}>
                      {product.description}
                    </p>
                  )}

                  {(product.sku || product.stockCount != null) && (
                    <p className={styles.productDescription}>
                      {product.sku && <span>SKU: {product.sku}</span>}
                      {product.sku && product.stockCount != null && ' · '}
                      {product.stockCount != null && (
                        <span>In stock: {product.stockCount}</span>
                      )}
                    </p>
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
            Visualizing your public Sedifex workspaces on a map.
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

function StoreMap({ stores }: { stores: StoreRecord[] }) {
  const storesWithCoords = useMemo(
    () => stores.filter(hasCoordinates),
    [stores],
  )

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)

  const center = useMemo(() => {
    if (storesWithCoords.length === 0) {
      // Default center (roughly Africa/Europe area)
      return { lat: 7, lng: 0 }
    }
    if (storesWithCoords.length === 1) {
      return {
        lat: storesWithCoords[0].latitude as number,
        lng: storesWithCoords[0].longitude as number,
      }
    }
    const sum = storesWithCoords.reduce(
      (acc, store) => ({
        lat: acc.lat + (store.latitude as number),
        lng: acc.lng + (store.longitude as number),
      }),
      { lat: 0, lng: 0 },
    )
    return {
      lat: sum.lat / storesWithCoords.length,
      lng: sum.lng / storesWithCoords.length,
    }
  }, [storesWithCoords])

  const activeStore = useMemo(
    () => storesWithCoords.find(store => store.id === activeStoreId) || null,
    [storesWithCoords, activeStoreId],
  )

  const zoom = storesWithCoords.length === 1 ? 12 : 3

  return (
    <section className={styles.mapSection} aria-label="Store locations">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.kicker}>Map</p>
          <h2 className={styles.mapTitle}>Where you’ll find these stores</h2>
          <p className={styles.mapSubtitle}>
            Explore stores directly on Google Maps. Click a pin to see details and
            open the storefront page.
          </p>
        </div>
        <span className={styles.resultCount} aria-live="polite">
          {storesWithCoords.length} store
          {storesWithCoords.length === 1 ? '' : 's'} on the map
        </span>
      </div>

      <div className={styles.mapCanvas}>
        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <p className={styles.muted}>
            Google Maps API key is missing. Add{' '}
            <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment.
          </p>
        )}

        {loadError && (
          <p className={styles.muted}>
            Unable to load Google Maps right now. Please try again later.
          </p>
        )}

        {!loadError && !isLoaded && (
          <div className={styles.mapSkeleton}>
            <div className={styles.mapSkeletonDot} />
            <div className={styles.mapSkeletonDot} />
            <div className={styles.mapSkeletonDot} />
          </div>
        )}

        {isLoaded && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            options={{
              disableDefaultUI: false,
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {storesWithCoords.map(store => (
              <Marker
                key={store.id}
                position={{
                  lat: store.latitude as number,
                  lng: store.longitude as number,
                }}
                onClick={() => setActiveStoreId(store.id)}
              />
            ))}

            {activeStore && (
              <InfoWindow
                position={{
                  lat: activeStore.latitude as number,
                  lng: activeStore.longitude as number,
                }}
                onCloseClick={() => setActiveStoreId(null)}
              >
                <div className={styles.infoWindow}>
                  <strong>
                    {activeStore.displayName || activeStore.name || 'Store'}
                  </strong>
                  <p className={styles.muted}>
                    {[
                      activeStore.addressLine1,
                      activeStore.city,
                      activeStore.region,
                      activeStore.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <a
                    href={`/stores/${activeStore.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.secondaryButton}
                  >
                    View details
                  </a>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
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
        if (!cancelled)
          setError('Unable to load stores right now. Please retry.')
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

  const countryCount = new Set(
    filteredStores
      .map(store => (store.country || '').toLowerCase())
      .filter(Boolean),
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
              className={`${styles.grid} ${
                loading ? styles.gridSkeleton : ''
              }`}
            >
              {loading &&
                Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}

              {!loading && paginatedStores.length === 0 && (
                <div className={styles.emptyCard}>
                  <div className={styles.emptyIcon} />
                  <div>
                    <h3 className={styles.emptyTitle}>
                      No stores match this view
                    </h3>
                    <p className={styles.emptyCopy}>
                      Adjust your filters or clear the search to see more
                      partners. We’ll keep the canvas fresh as new stores go
                      live.
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
