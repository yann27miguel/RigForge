/**
 * Firebase is optional. When the VITE_FIREBASE_* variables are set (see .env.example),
 * real accounts are used: Google sign-in + email/password with a verification email,
 * and saved builds sync to Firestore. Without them the app runs in a clearly labelled
 * demo mode that keeps accounts in this browser only.
 */
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const env = import.meta.env
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const firebaseEnabled = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)

let cached: Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> | null = null

/** Lazily loads the Firebase SDK so visitors who never sign in don't download it. */
export function getFirebase() {
  if (!firebaseEnabled) throw new Error('Firebase is not configured')
  cached ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
    const app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>)
    return { app, auth: getAuth(app), db: getFirestore(app) }
  })()
  return cached
}
