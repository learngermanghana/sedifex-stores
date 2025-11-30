import { NextResponse } from 'next/server'
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { db } from '@/lib/firebaseClient'

export const dynamic = 'force-dynamic'

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

type GeocodeResult = { latitude: number; longitude: number }

const geocodeCache = new Map<string, GeocodeResult>()

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (geocodeCache.has(address)) return geocodeCache.get(address) as GeocodeResult

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'sedifex-stores/1.0',
      },
    })

    if (!response.ok) return null

    const results = (await response.json()) as Array<{ lat?: string; lon?: string }>
    const [first] = results

    if (!first?.lat || !first.lon) return null

    const latitude = Number.parseFloat(first.lat)
    const longitude = Number.parseFloat(first.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

    const coordinates = { latitude, longitude }
    geocodeCache.set(address, coordinates)
    return coordinates
  } catch (error) {
    console.warn('[stores api] geocoding failed', error)
    return null
  }
}

type StorePayload = {
  id: string
  [key: string]: unknown
  latitude?: number | null
  longitude?: number | null
  products?: StoreProductPayload[]
}

type StoreProductPayload = {
  id: string
  title: string | null
  category: string | null
  description: string | null
  price: number | null
  currency: string | null
}

function toStoreProduct(
  data: Record<string, unknown>,
  id: string,
): StoreProductPayload | null {
  const title =
    toNullableString(data.title) ||
    toNullableString(data.name) ||
    toNullableString(data.label)

  const category =
    toNullableString(data.category) ||
    toNullableString(data.type) ||
    toNullableString(data.kind)

  const description = toNullableString(data.description)
  const price = toNumber(data.price)
  const currency = toNullableString(data.currency) || toNullableString(data.unit)

  if (!title && !description && !category) return null

  return {
    id,
    title,
    category,
    description,
    price,
    currency,
  }
}

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'stores'))

    const stores: StorePayload[] = []

    for (const docSnap of snapshot.docs) {
      const rawData = docSnap.data() as Record<string, unknown>
      const id = docSnap.id
      const address = [
        toNullableString(rawData.addressLine1),
        toNullableString(rawData.city),
        toNullableString(rawData.region),
        toNullableString(rawData.country),
      ]
        .filter(Boolean)
        .join(', ')

      let latitude = toNumber(rawData.latitude)
      let longitude = toNumber(rawData.longitude)

      if ((latitude === null || longitude === null) && address) {
        const geocoded = await geocodeAddress(address)
        if (geocoded) {
          latitude = geocoded.latitude
          longitude = geocoded.longitude
          try {
            await updateDoc(doc(db, 'stores', id), {
              latitude,
              longitude,
              geocodedAt: serverTimestamp(),
            })
          } catch (error) {
            console.warn('[stores api] unable to update coordinates for', id, error)
          }
        }
      }

      const productSnapshot = await getDocs(collection(doc(db, 'stores', id), 'products'))
      const products: StoreProductPayload[] = productSnapshot.docs
        .map(productDoc => {
          const data = productDoc.data() as Record<string, unknown>
          return toStoreProduct(data, productDoc.id)
        })
        .filter(Boolean) as StoreProductPayload[]

      stores.push({
        id,
        ...rawData,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        products,
      })
    }

    return NextResponse.json({ stores })
  } catch (error) {
    console.error('[stores api] failed to load stores', error)
    return NextResponse.json(
      { error: 'Unable to load stores right now. Please retry.' },
      { status: 500 },
    )
  }
}
