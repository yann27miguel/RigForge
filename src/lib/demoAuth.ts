/**
 * DEMO MODE ONLY – used when Firebase keys are not configured.
 * Accounts live in this browser's localStorage, passwords are SHA-256 hashed,
 * and the "email" verification code is shown on screen instead of being sent.
 * Not secure for real users: configure Firebase for production.
 */
export interface DemoUser {
  uid: string
  email: string
  displayName: string
  passHash?: string
  provider: 'password' | 'google'
  emailVerified: boolean
  pendingCode?: string
  createdAt: number
}

const KEY = 'rigforge-demo-users'
const SESSION = 'rigforge-demo-session'

function safeGet<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function safeSet(k: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* storage unavailable – demo session lasts until reload */
  }
}

export async function hash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rigforge:' + text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const demoUsers = {
  all: () => safeGet<DemoUser[]>(KEY, []),
  save: (users: DemoUser[]) => safeSet(KEY, users),
  find: (email: string) => demoUsers.all().find((u) => u.email.toLowerCase() === email.toLowerCase()),
  upsert(u: DemoUser) {
    const rest = demoUsers.all().filter((x) => x.uid !== u.uid)
    demoUsers.save([...rest, u])
  },
  remove(uid: string) {
    demoUsers.save(demoUsers.all().filter((x) => x.uid !== uid))
    safeSet(`rigforge-demo-data:${uid}`, null)
  },
  session: () => safeGet<string | null>(SESSION, null),
  setSession: (uid: string | null) => safeSet(SESSION, uid),
  loadData: <T,>(uid: string) => safeGet<T | null>(`rigforge-demo-data:${uid}`, null),
  saveData: (uid: string, data: unknown) => safeSet(`rigforge-demo-data:${uid}`, data),
}

export const newCode = () => String(Math.floor(100000 + Math.random() * 900000))
export const newUid = () => 'demo-' + (crypto.randomUUID?.() ?? String(Date.now()))
