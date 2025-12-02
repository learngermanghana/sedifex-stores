// app/api/stores/route.ts
import { NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient' // ✅ use your existing file

type ProductRecord = Record<string, unknown> & { id: string }

export async function GET() {
  try {
    const storesSnap = await getDocs(collection(db, 'stores'))
    const productsSnap = await getDocs(collection(db, 'products'))

    const productsByStoreId: Record<string, ProductRecord[]> = {}

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
