// src/lib/firebaseClient.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// ⚠️ Copy these values from your existing Sedifex web app
// (your current firebase.ts in sedifexbiz-main/web/src/firebase.ts)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

let app: FirebaseApp
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]!
}

export const db = getFirestore(app)
