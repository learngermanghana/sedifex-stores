'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'

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
  const title = store.displayName || store.name
  const location = formatLocation(store)

  return (
    <div className={styles.dialogOverlay}
