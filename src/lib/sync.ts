import { useEffect, useRef } from 'react'
import type { Build } from '../data/types'
import { useAuth } from '../store/auth'
import { useBuild, type SavedBuild } from '../store/build'
import { demoUsers } from './demoAuth'
import { firebaseEnabled, getFirebase } from './firebase'

export interface CloudData {
  savedBuilds: SavedBuild[]
  owned: Build
  current: Build
  updatedAt: number
}

async function load(uid: string): Promise<CloudData | null> {
  if (!firebaseEnabled) return demoUsers.loadData<CloudData>(uid)
  const { db } = await getFirebase()
  const { doc, getDoc } = await import('firebase/firestore')
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as CloudData) : null
}

async function save(uid: string, data: CloudData) {
  if (!firebaseEnabled) return demoUsers.saveData(uid, data)
  const { db } = await getFirebase()
  const { doc, setDoc } = await import('firebase/firestore')
  // Firestore rejects `undefined` values – strip them through JSON
  await setDoc(doc(db, 'users', uid), JSON.parse(JSON.stringify(data)))
}

const isEmpty = (b?: Build) => !b || (!b.cpu && !b.gpu && !b.motherboard && !b.case && !b.ram && !b.psu && !b.cooler && !b.fans && !(b.storage?.length))

/** Keeps saved builds, owned parts and the current build in sync with the signed-in, verified account. */
export function useCloudSync() {
  const user = useAuth((s) => s.user)
  const uid = user?.emailVerified ? user.uid : null
  const loaded = useRef<string | null>(null)
  useEffect(() => {
    if (!uid) {
      loaded.current = null
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    load(uid)
      .then((data) => {
        if (cancelled) return
        const st = useBuild.getState()
        if (data) {
          st.mergeSaved(data.savedBuilds ?? [])
          if (isEmpty(st.owned) && !isEmpty(data.owned)) st.setOwned(data.owned)
          if (isEmpty(st.build) && !isEmpty(data.current)) st.load(data.current)
        }
        loaded.current = uid
      })
      .catch(() => {
        loaded.current = uid
      })
    const unsub = useBuild.subscribe((s, prev) => {
      if (loaded.current !== uid) return
      if (s.saved === prev.saved && s.owned === prev.owned && s.build === prev.build) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        save(uid, { savedBuilds: s.saved, owned: s.owned, current: s.build, updatedAt: Date.now() }).catch(() => undefined)
      }, 1200)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      unsub()
    }
  }, [uid])
}
