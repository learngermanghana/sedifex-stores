'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
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

function toDate(value: any): Date | null {
  if (!value) return null
  if (value?.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate()
    } catch {
      return null
    }
  }
  if (value instanceof Date) return value
  return null
}

function mapStore(data: any, id: string): StoreRecord {
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

export default function HomePage() {
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return stores
    const term = searchTerm.toLowerCase()
    return stores.filter(store => {
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
    })
  }, [stores, searchTerm])

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        maxWidth: 960,
        margin: '0 auto',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: 8,
          }}
        >
          Sedifex store directory
        </h1>
        <p style={{ maxWidth: 620, color: '#4b5563', fontSize: 14 }}>
          Browse businesses powered by Sedifex. View their location and contact
          details, then reach out to them directly to order or visit in person.
        </p>
      </header>

      <section
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="search"
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: '#4b5563',
              marginBottom: 6,
            }}
          >
            Search by name, city, or country
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="e.g. Xenom, Accra, Ghana"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}
        >
          Showing {filteredStores.length} store
          {filteredStores.length === 1 ? '' : 's'}
        </span>
      </section>

      {loading && (
        <p style={{ fontSize: 14, color: '#4b5563' }}>Loading stores…</p>
      )}

      {error && (
        <p
          style={{ fontSize: 14, color: '#b91c1c', marginTop: 8 }}
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && !error && filteredStores.length === 0 && (
        <p style={{ fontSize: 14, color: '#4b5563', marginTop: 8 }}>
          No stores found yet. Once you activate more Sedifex workspaces and
          mark them as public, they’ll appear here automatically.
        </p>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        {filteredStores.map(store => {
          const title = store.displayName || store.name
          const locationParts = [
            store.addressLine1,
            store.city,
            store.country,
          ].filter(Boolean)
          const location = locationParts.join(', ')

          return (
            <article
              key={store.id}
              style={{
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                padding: '16px 18px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {title}
              </h2>

              <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
                {location || 'Location coming soon'}
              </p>

              {store.publicDescription && (
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#111827',
                  }}
                >
                  {store.publicDescription}
                </p>
              )}

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: '#4b5563',
                }}
              >
                {store.phone && (
                  <div>
                    Phone:{' '}
                    <a
                      href={`tel:${store.phone}`}
                      style={{ color: '#4338CA' }}
                    >
                      {store.phone}
                    </a>
                  </div>
                )}
                {store.email && (
                  <div>
                    Email:{' '}
                    <a
                      href={`mailto:${store.email}`}
                      style={{ color: '#4338CA' }}
                    >
                      {store.email}
                    </a>
                  </div>
                )}
              </div>

              <p
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Powered by Sedifex · Status:{' '}
                <strong>{store.contractStatus ?? store.status ?? '—'}</strong>
              </p>
            </article>
          )
        })}
      </section>
    </main>
  )
}
