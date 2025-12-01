// src/app/api/stores/route.ts
import { NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase' // ⬅️ change to your actual path

export async function GET() {
  try {
    // Fetch all stores
    const storesSnap = await getDocs(collection(db, 'stores'))

    // Fetch all products
    const productsSnap = await getDocs(collection(db, 'products'))

    // Group products by storeId
    const productsByStoreId: Record<string, any[]> = {}

    productsSnap.forEach(doc => {
      const data = doc.data()
      const storeId = data.storeId as string | undefined
      if (!storeId) return

      if (!productsByStoreId[storeId]) {
        productsByStoreId[storeId] = []
      }

      productsByStoreId[storeId].push({
        id: doc.id,
        ...data,
      })
    })

    // Attach products to each store
    const stores = storesSnap.docs.map(doc => {
      const data = doc.data()
      const storeId = doc.id

      return {
        id: storeId,
        ...data,
        products: productsByStoreId[storeId] ?? [],
      }
    })

    return NextResponse.json({ stores })
  } catch (error) {
    console.error('Error loading stores:', error)
    return NextResponse.json(
      { error: 'Unable to load stores right now. Please retry.' },
      { status: 500 },
    )
  }
}
