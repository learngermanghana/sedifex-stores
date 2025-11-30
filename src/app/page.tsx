'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'

import styles from './page.module.css'
import { db } from '@/lib/firebaseClient'

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

function StoreCard({
  store,
  onSelect,
}: {
  store: StoreRecord
  onSelect: (store: StoreRecord) => void
}) {
  const title = store.displayName || store.name
  const location = formatLocation(store)

  return (
    <article className={styles.card}>
      <header>
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

      <p className={styles.cardFooter}>
        Powered by Sedifex · Status:{' '}
        <strong>{store.contractStatus ?? store.status ?? '—'}</strong>
      </p>

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
            Pins are placed using the store’s formatted address (street, city, country)
            so you can quickly scan where each Sedifex partner is located.
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
  const title = store.displayName || store.name
  const location = formatLocation(store)

  return (
    <div className={styles.dialogOverlay} role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${title}`}
        className={styles.dialog}
        onClick={event => event.stopPropagation()}
      >
        <header className={styles.dialogHeader}>
          <div>
            <p className={styles.cardEyebrow}>Store</p>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardSubtitle}>
              {location || 'Location coming soon'}
            </p>
          </div>
          <button className={styles.secondaryButton} type="button" onClick={onClose}>
            Close
          </button>
        </header>

        {store.publicDescription && (
          <p className={styles.dialogDescription}>{store.publicDescription}</p>
        )}

        <dl className={styles.dialogMeta}>
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
              <dt>Address</dt>
              <dd>{location}</dd>
            </div>
          )}
        </dl>

        <p className={styles.cardFooter}>
          Powered by Sedifex · Status:{' '}
          <strong>{store.contractStatus ?? store.status ?? '—'}</strong>
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [contractStatusFilter, setContractStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('name')
  const [selectedStore, setSelectedStore] = useState<StoreRecord | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStores() {
      setLoading(true)
      setError(null)

      try {
        const storesRef = collection(db, 'stores')

        // ✅ Only show stores that opted into the public directory
        const q = query(storesRef, where('isPublicDirectory', '==', true))

        const snapshot = await getDocs(q)
        if (cancelled) return

        const rows: StoreRecord[] = snapshot.docs.map(docSnap =>
          mapStore(docSnap.data(), docSnap.id),
        )

        // Filter out stores with *zero* public info (extra safety)
        const visible = rows.filter(
          s =>
            (s.displayName || s.name) &&
            (s.city ||
              s.country ||
              s.phone ||
              s.email ||
              s.addressLine1 ||
              s.publicDescription),
        )

        // Sort alphabetically by name
        visible.sort((a, b) => {
          const nameA = (a.displayName || a.name || '').toLowerCase()
          const nameB = (b.displayName || b.name || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })

        setStores(visible)
      } catch (err) {
        console.error('[directory] Failed to load stores', err)
        if (!cancelled) {
          setError(
            'We could not load the store directory. Please check your Firestore config or rules.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStores()

    return () => {
      cancelled = true
    }
  }, [])

  const normalize = (value: string | null) => (value || '').toLowerCase()

  const countryOptions = useMemo(
    () => buildOptions(stores.map(store => store.country)),
    [stores],
  )

  const regionOptions = useMemo(
    () => buildOptions(stores.map(store => store.region)),
    [stores],
  )

  const contractStatusOptions = useMemo(
    () => buildOptions(stores.map(store => store.contractStatus)),
    [stores],
  )

  const filteredStores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const matchesSearch = (store: StoreRecord) => {
      if (!term) return true
      const name = (store.displayName || store.name || '').toLowerCase()
      const city = (store.city || '').toLowerCase()
      const country = (store.country || '').toLowerCase()
      const address = (store.addressLine1 || '').toLowerCase()
      const desc = (store.publicDescription || '').toLowerCase()
      return (
        name.includes(term) ||
        city.includes(term) ||
        country.includes(term) ||
        address.includes(term) ||
        desc.includes(term)
      )
    }

    const matchesFilters = (store: StoreRecord) => {
      const matchesCountry =
        countryFilter === 'all' || normalize(store.country) === countryFilter
      const matchesRegion =
        regionFilter === 'all' || normalize(store.region) === regionFilter
      const matchesContractStatus =
        contractStatusFilter === 'all' ||
        normalize(store.contractStatus) === contractStatusFilter

      return matchesCountry && matchesRegion && matchesContractStatus
    }

    const sorted = stores
      .filter(store => matchesSearch(store) && matchesFilters(store))
      .slice()

    sorted.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? a.createdAt.getTime() : 0
        const dateB = b.createdAt ? b.createdAt.getTime() : 0
        if (dateA !== dateB) return dateB - dateA
      }

      const nameA = (a.displayName || a.name || '').toLowerCase()
      const nameB = (b.displayName || b.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return sorted
  }, [stores, searchTerm, countryFilter, regionFilter, contractStatusFilter, sortBy])

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Directory</p>
            <h1 className={styles.title}>Sedifex store directory</h1>
          </div>
          <p className={styles.lead}>
            Browse businesses powered by Sedifex. View their location and
            contact details, then reach out to them directly to order or visit
            in person.
          </p>
        </header>

        <section className={styles.toolbar} aria-label="Search stores">
          <div className={styles.toolbarRow}>
            <div className={styles.searchField}>
              <label htmlFor="search">Search by name, city, or description</label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="e.g. Xenom, Accra, Ghana"
              />
            </div>
            <span className={styles.resultCount} aria-live="polite">
              Showing {filteredStores.length} store
              {filteredStores.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className={styles.toolbarRow}>
            <div className={styles.filters}>
              <div className={styles.selectField}>
                <label htmlFor="country">Country/region</label>
                <select
                  id="country"
                  value={countryFilter}
                  onChange={e => setCountryFilter(e.target.value)}
                >
                  <option value="all">All locations</option>
                  {countryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.selectField}>
                <label htmlFor="region">Region</label>
                <select
                  id="region"
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                >
                  <option value="all">All regions</option>
                  {regionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.selectField}>
                <label htmlFor="contractStatus">Contract status</label>
                <select
                  id="contractStatus"
                  value={contractStatusFilter}
                  onChange={e => setContractStatusFilter(e.target.value)}
                >
                  <option value="all">All contract statuses</option>
                  {contractStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.selectField}>
              <label htmlFor="sort">Sort by</label>
              <select
                id="sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'name' | 'newest')}
              >
                <option value="name">Name (A–Z)</option>
                <option value="newest">Newest onboarding</option>
              </select>
            </div>
          </div>
        </section>

        {loading && (
          <p className={styles.muted} aria-live="polite">
            Loading stores…
          </p>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {!loading && !error && filteredStores.length === 0 && (
          <p className={styles.muted} aria-live="polite">
            No stores found yet. Once you activate more Sedifex workspaces and
            mark them as public, they’ll appear here automatically.
          </p>
        )}

        <div className={styles.layout}>
          <StoreMap stores={filteredStores} />

          <section className={styles.grid} aria-live="polite">
            {filteredStores.map(store => (
              <StoreCard
                store={store}
                key={store.id}
                onSelect={setSelectedStore}
              />
            ))}
          </section>
        </div>
      </div>

      {selectedStore && (
        <StoreDetails store={selectedStore} onClose={() => setSelectedStore(null)} />
      )}
    </main>
  )
}
