// lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // optional but nice to include:
  storageBucket: 'sedifex-web.appspot.com',
  messagingSenderId: '866480271132',
  appId: '1:866480271132:web:5c0d85556cf16d37a614d9',
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)

// 🔍 debug once:
type InternalDbShape = { _databaseId?: { projectId?: string } }
const resolvedDb = db as InternalDbShape

console.log('[firebase] config projectId =', firebaseConfig.projectId)
console.log('[firebase] db projectId =', resolvedDb._databaseId?.projectId)
