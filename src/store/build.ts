import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Build, Category, Part } from '../data/types'
import { EMPTY_BUILD, withPart } from '../lib/build'

export interface SavedBuild {
  id: string
  name: string
  build: Build
  savedAt: number
  /** listed price of a prebuilt / imported PC (overrides the sum of parts) */
  price?: number
  /** where an imported PC came from */
  source?: string
}

interface BuildState {
  build: Build
  focus: Category | null
  /** category whose picker is open */
  picking: Category | null
  /** last part added – used for the 3D "snap in" animation */
  lastAdded: { cat: Category | 'all'; at: number } | null
  saved: SavedBuild[]
  compare: string[]
  /** parts the user already owns (used by the build assistant) */
  owned: Build
  setOwned: (b: Build) => void
  mergeSaved: (list: SavedBuild[]) => void
  addPart: (p: Part) => void
  removePart: (c: Category, id?: string) => void
  load: (b: Build) => void
  clear: () => void
  setFocus: (c: Category | null) => void
  openPicker: (c: Category | null) => void
  saveAs: (name: string) => void
  saveImported: (b: SavedBuild) => void
  deleteSaved: (id: string) => void
  toggleCompare: (id: string) => void
  setCompare: (ids: string[]) => void
}

export const useBuild = create<BuildState>()(
  persist(
    (set, get) => ({
      build: EMPTY_BUILD,
      focus: null,
      picking: null,
      lastAdded: null,
      saved: [],
      compare: [],
      owned: EMPTY_BUILD,
      setOwned: (b) => set({ owned: { ...EMPTY_BUILD, ...b, storage: [...(b.storage ?? [])] } }),
      mergeSaved: (list) => {
        const have = new Set(get().saved.map((s) => s.id))
        set({ saved: [...get().saved, ...list.filter((s) => !have.has(s.id))].sort((a, b) => b.savedAt - a.savedAt).slice(0, 50) })
      },
      addPart: (p) => set({ build: withPart(get().build, p), lastAdded: { cat: p.category, at: Date.now() }, focus: p.category }),
      removePart: (c, id) => {
        const b = { ...get().build }
        if (c === 'storage') b.storage = id ? b.storage.filter((s) => s !== id) : []
        else delete b[c]
        set({ build: b })
      },
      load: (b) => set({ build: { ...EMPTY_BUILD, ...b, storage: [...(b.storage ?? [])] }, lastAdded: { cat: 'all', at: Date.now() } }),
      clear: () => set({ build: EMPTY_BUILD, focus: null }),
      setFocus: (c) => set({ focus: c }),
      openPicker: (c) => set({ picking: c }),
      saveAs: (name) => set({ saved: [{ id: crypto.randomUUID?.() ?? String(Date.now()), name, build: get().build, savedAt: Date.now() }, ...get().saved].slice(0, 30) }),
      saveImported: (b) => set({ saved: [b, ...get().saved.filter((s) => s.id !== b.id)].slice(0, 50) }),
      deleteSaved: (id) => set({ saved: get().saved.filter((s) => s.id !== id) }),
      toggleCompare: (id) => {
        const c = get().compare
        set({ compare: c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-4) })
      },
      setCompare: (ids) => set({ compare: ids.slice(0, 4) }),
    }),
    { name: 'rigforge-build', partialize: (s) => ({ build: s.build, saved: s.saved, compare: s.compare, owned: s.owned }) },
  ),
)
