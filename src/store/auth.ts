import { create } from 'zustand'
import { demoUsers, hash, newCode, newUid, type DemoUser } from '../lib/demoAuth'
import { firebaseEnabled, getFirebase } from '../lib/firebase'

export interface AuthUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string | null
  emailVerified: boolean
  provider: 'google' | 'password'
}

interface AuthState {
  mode: 'firebase' | 'demo'
  ready: boolean
  busy: boolean
  user: AuthUser | null
  /** i18n key under auth.err.* */
  error: string | null
  /** demo mode only: the code that would have been emailed */
  demoCode: string | null
  info: string | null
  init: () => void
  google: (demoEmail?: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  sendVerification: () => Promise<void>
  verifyDemo: (code: string) => Promise<void>
  refresh: () => Promise<void>
  reset: (email: string) => Promise<void>
  rename: (name: string) => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  clearMessages: () => void
}

const ERR: Record<string, string> = {
  'auth/invalid-credential': 'badCredentials',
  'auth/wrong-password': 'badCredentials',
  'auth/user-not-found': 'badCredentials',
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  'auth/invalid-email': 'invalidEmail',
  'auth/popup-closed-by-user': 'popupClosed',
  'auth/cancelled-popup-request': 'popupClosed',
  'auth/popup-blocked': 'popupBlocked',
  'auth/too-many-requests': 'tooMany',
  'auth/requires-recent-login': 'recentLogin',
  'auth/network-request-failed': 'network',
  'auth/unauthorized-domain': 'unauthorizedDomain',
}
const errKey = (e: unknown) => ERR[(e as { code?: string })?.code ?? ''] ?? ((e as Error)?.message?.startsWith('rf:') ? (e as Error).message.slice(3) : 'generic')
const fail = (key: string) => new Error('rf:' + key)
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)

function fromDemo(u: DemoUser): AuthUser {
  return { uid: u.uid, email: u.email, displayName: u.displayName, emailVerified: u.emailVerified, provider: u.provider, photoURL: null }
}

type FbUser = import('firebase/auth').User
function fromFirebase(u: FbUser): AuthUser {
  const google = u.providerData.some((p) => p.providerId === 'google.com')
  return { uid: u.uid, email: u.email ?? '', displayName: u.displayName ?? (u.email ?? '').split('@')[0], photoURL: u.photoURL, emailVerified: u.emailVerified || google, provider: google ? 'google' : 'password' }
}

let initStarted = false

export const useAuth = create<AuthState>()((set, get) => {
  /** wraps an action with busy/error handling */
  const run = async (fn: () => Promise<void>) => {
    set({ busy: true, error: null, info: null })
    try {
      await fn()
    } catch (e) {
      set({ error: errKey(e) })
    } finally {
      set({ busy: false })
    }
  }

  return {
    mode: firebaseEnabled ? 'firebase' : 'demo',
    ready: false,
    busy: false,
    user: null,
    error: null,
    demoCode: null,
    info: null,

    init: () => {
      if (initStarted) return
      initStarted = true
      if (!firebaseEnabled) {
        const uid = demoUsers.session()
        const u = uid ? demoUsers.all().find((x) => x.uid === uid) : undefined
        set({ user: u ? fromDemo(u) : null, ready: true, demoCode: u?.pendingCode ?? null })
        return
      }
      getFirebase()
        .then(async ({ auth }) => {
          const { onAuthStateChanged } = await import('firebase/auth')
          onAuthStateChanged(auth, (u) => set({ user: u ? fromFirebase(u) : null, ready: true }))
        })
        .catch(() => set({ ready: true, error: 'generic' }))
    },

    google: (demoEmail) =>
      run(async () => {
        if (!firebaseEnabled) {
          const email = (demoEmail ?? '').trim()
          if (!validEmail(email)) throw fail('invalidEmail')
          let u = demoUsers.find(email)
          if (!u) u = { uid: newUid(), email, displayName: email.split('@')[0], provider: 'google', emailVerified: true, createdAt: Date.now() }
          demoUsers.upsert(u)
          demoUsers.setSession(u.uid)
          set({ user: fromDemo(u) })
          return
        }
        const { auth } = await getFirebase()
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const cred = await signInWithPopup(auth, provider)
        set({ user: fromFirebase(cred.user) })
      }),

    signUp: (name, email, password) =>
      run(async () => {
        if (!validEmail(email)) throw fail('invalidEmail')
        if (password.length < 8) throw fail('weakPassword')
        if (!firebaseEnabled) {
          if (demoUsers.find(email)) throw fail('emailInUse')
          const code = newCode()
          const u: DemoUser = { uid: newUid(), email, displayName: name || email.split('@')[0], passHash: await hash(password), provider: 'password', emailVerified: false, pendingCode: code, createdAt: Date.now() }
          demoUsers.upsert(u)
          demoUsers.setSession(u.uid)
          set({ user: fromDemo(u), demoCode: code })
          return
        }
        const { auth } = await getFirebase()
        const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth')
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) await updateProfile(cred.user, { displayName: name })
        await sendEmailVerification(cred.user, { url: window.location.href.split('#')[0] + '#/account' })
        set({ user: fromFirebase(cred.user), info: 'verificationSent' })
      }),

    signIn: (email, password) =>
      run(async () => {
        if (!firebaseEnabled) {
          const u = demoUsers.find(email)
          if (!u || u.provider !== 'password' || u.passHash !== (await hash(password))) throw fail('badCredentials')
          demoUsers.setSession(u.uid)
          set({ user: fromDemo(u), demoCode: u.pendingCode ?? null })
          return
        }
        const { auth } = await getFirebase()
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const cred = await signInWithEmailAndPassword(auth, email, password)
        set({ user: fromFirebase(cred.user) })
      }),

    sendVerification: () =>
      run(async () => {
        const user = get().user
        if (!user) return
        if (!firebaseEnabled) {
          const u = demoUsers.all().find((x) => x.uid === user.uid)
          if (!u) return
          u.pendingCode = newCode()
          demoUsers.upsert(u)
          set({ demoCode: u.pendingCode, info: 'verificationSent' })
          return
        }
        const { auth } = await getFirebase()
        const { sendEmailVerification } = await import('firebase/auth')
        if (auth.currentUser) await sendEmailVerification(auth.currentUser, { url: window.location.href.split('#')[0] + '#/account' })
        set({ info: 'verificationSent' })
      }),

    verifyDemo: (code) =>
      run(async () => {
        const user = get().user
        const u = user && demoUsers.all().find((x) => x.uid === user.uid)
        if (!u || !u.pendingCode || code.trim() !== u.pendingCode) throw fail('badCode')
        u.emailVerified = true
        delete u.pendingCode
        demoUsers.upsert(u)
        set({ user: fromDemo(u), demoCode: null, info: 'verified' })
      }),

    refresh: () =>
      run(async () => {
        if (!firebaseEnabled) return
        const { auth } = await getFirebase()
        const { reload } = await import('firebase/auth')
        if (auth.currentUser) {
          await reload(auth.currentUser)
          await auth.currentUser.getIdToken(true) // refresh token so Firestore rules see email_verified
          set({ user: fromFirebase(auth.currentUser), info: auth.currentUser.emailVerified ? 'verified' : 'notYetVerified' })
        }
      }),

    reset: (email) =>
      run(async () => {
        if (!validEmail(email)) throw fail('invalidEmail')
        if (!firebaseEnabled) {
          set({ info: 'resetDemo' })
          return
        }
        const { auth } = await getFirebase()
        const { sendPasswordResetEmail } = await import('firebase/auth')
        await sendPasswordResetEmail(auth, email)
        set({ info: 'resetSent' })
      }),

    rename: (name) =>
      run(async () => {
        const user = get().user
        if (!user || !name.trim()) return
        if (!firebaseEnabled) {
          const u = demoUsers.all().find((x) => x.uid === user.uid)
          if (u) {
            u.displayName = name.trim()
            demoUsers.upsert(u)
            set({ user: fromDemo(u) })
          }
          return
        }
        const { auth } = await getFirebase()
        const { updateProfile } = await import('firebase/auth')
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name.trim() })
          set({ user: fromFirebase(auth.currentUser) })
        }
      }),

    signOut: () =>
      run(async () => {
        if (!firebaseEnabled) {
          demoUsers.setSession(null)
          set({ user: null, demoCode: null })
          return
        }
        const { auth } = await getFirebase()
        const { signOut } = await import('firebase/auth')
        await signOut(auth)
        set({ user: null })
      }),

    deleteAccount: () =>
      run(async () => {
        const user = get().user
        if (!user) return
        if (!firebaseEnabled) {
          demoUsers.remove(user.uid)
          demoUsers.setSession(null)
          set({ user: null, demoCode: null })
          return
        }
        const { auth, db } = await getFirebase()
        const [{ deleteUser }, { doc, deleteDoc }] = await Promise.all([import('firebase/auth'), import('firebase/firestore')])
        if (!auth.currentUser) return
        await deleteDoc(doc(db, 'users', auth.currentUser.uid)).catch(() => undefined)
        await deleteUser(auth.currentUser)
        set({ user: null })
      }),

    clearMessages: () => set({ error: null, info: null }),
  }
})
