'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'

import styles from './page.module.css'
import { db } from '@/lib/firebaseClient'

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

function formatDate(value: Date | null) {
  return value
    ? value.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'
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
  }
}

function formatLocation(store: StoreRecord): string {
  const locationParts = [store.addressLine1, store.city, store.country].filter(
    Boolean,
  )
  return locationParts.join(', ')
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

function StoreCard({
  store,
  onSelect,
}: {
  store: StoreRecord
  onSelect: (store: StoreRecord) => void
}) {
  const title = store.displayName || store.name || 'Store'
  const location = formatLocation(store)
  const [copied, setCopied] = useState(false)

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
        <p className={styles.cardFooterText}>
          Powered by Sedifex · Status:{' '}
          <strong>{store.contractStatus ?? store.status ?? '—'}</strong>
        </p>
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

      <div className={styles.cardActions}>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => onSelect(store)}
          aria-label={`View details for ${title}`}
        >
          View details
        </button>
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

function computeStablePosition(text: string, salt: number) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i) + salt * 17) % 100000
  }

  const x = 12 + (hash % 76)
  const y = 12 + ((hash / 100) % 76)

  return { x, y }
}

function StoreMap({ stores }: { stores: StoreRecord[] }) {
  const pins = stores
    .map((store, index) => ({
      store,
      location: formatLocation(store),
      index,
    }))
    .filter(entry => entry.location)

  return (
    <section className={styles.mapSection} aria-label="Store locations">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.kicker}>Map</p>
          <h2 className={styles.mapTitle}>Where you’ll find these stores</h2>
          <p className={styles.mapSubtitle}>
            Pins are placed using the store’s formatted address (street, city,
            country) so you can quickly scan where each Sedifex partner is
            located.
          </p>
        </div>
        <span className={styles.resultCount} aria-live="polite">
          {pins.length} pin{pins.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className={styles.mapCanvas} role="img" aria-label="Store map">
        {pins.length === 0 && (
          <p className={styles.muted}>Add a location to see pins on the map.</p>
        )}

        {pins.map(({ store, location, index }) => {
          const coords = computeStablePosition(location as string, index)
          const title = store.displayName || store.name || 'Store'

          return (
            <div
              key={store.id}
              className={styles.mapPin}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              title={location as string}
            >
              <span className={styles.pinDot} aria-hidden />
              <div className={styles.pinLabel}>
                <strong>{title}</strong>
                <span>{location}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StoreDetails({
  store,
  onClose,
}: {
  store: StoreRecord
  onClose: () => void
}) {
  const title = store.displayName || store.name || 'Store'
  const location = formatLocation(store)

  return (
    <div className={styles.dialogOverlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.cardEyebrow}>Store</p>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardSubtitle}>
              {location || 'Location coming soon'}
            </p>
          </div>
          <button className={styles.ghostButton} onClick={onClose} type="button">
            Close
          </button>
        </div>

        {store.publicDescription && (
          <p className={styles.dialogDescription}>{store.publicDescription}</p>
        )}

        <dl className={styles.dialogMeta}>
          {store.contractStatus && (
            <div>
              <dt>Contract</dt>
              <dd>{store.contractStatus}</dd>
            </div>
          )}
          {store.status && (
            <div>
              <dt>Status</dt>
              <dd>{store.status}</dd>
            </div>
          )}
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
          {location && (
            <div>
              <dt>Location</dt>
              <dd>{location}</dd>
            </div>
          )}
          <div>
            <dt>Created</dt>
            <dd>{formatDate(store.createdAt)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(store.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function Page() {
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedStore, setSelectedStore] = useState<StoreRecord | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadStores() {
      setError(null)
      setLoading(true)
      try {
        const storeSnapshot = await getDocs(collection(db, 'stores'))
        if (cancelled) return
        const results = storeSnapshot.docs.map(docSnap =>
          mapStore(docSnap.data() as Record<string, unknown>, docSnap.id),
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
  }, [searchTerm, statusFilter, countryFilter])

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

      const matchesStatus = statusFilter
        ? (store.contractStatus || store.status || '')
            .toLowerCase()
            .includes(statusFilter)
        : true

      const matchesCountry = countryFilter
        ? (store.country || '').toLowerCase() === countryFilter
        : true

      return matchesSearch && matchesStatus && matchesCountry
    })
  }, [stores, searchTerm, statusFilter, countryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE))
  const paginatedStores = filteredStores.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const statusOptions = buildOptions(
    stores.map(store => store.contractStatus ?? store.status),
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
              curated browsing experience. Filter by region, contract status, or
              search by name to find the workspace you need.
            </p>
            <div className={styles.heroPills}>
              <span className={styles.pill}>Real-time Firestore feed</span>
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
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value)}
                >
                  <option value="">Any status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value.toLowerCase()}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  <StoreCard key={store.id} store={store} onSelect={setSelectedStore} />
                ))}
            </div>

            <div className={styles.listFooter}>
              <p className={styles.muted}>
                {paginatedStores.length} result{paginatedStores.length === 1 ? '' : 's'} on
                this page
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

      {selectedStore && (
        <StoreDetails store={selectedStore} onClose={() => setSelectedStore(null)} />
      )}
    </main>
  )
}
