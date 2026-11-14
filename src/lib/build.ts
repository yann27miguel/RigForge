import { getPart } from '../data/parts'
import type { Build, Category, Part, ResolvedBuild } from '../data/types'

export const EMPTY_BUILD: Build = { storage: [] }

export function resolve(b: Build): ResolvedBuild {
  return {
    cpu: getPart(b.cpu, 'cpu'),
    cooler: getPart(b.cooler, 'cooler'),
    motherboard: getPart(b.motherboard, 'motherboard'),
    ram: getPart(b.ram, 'ram'),
    gpu: getPart(b.gpu, 'gpu'),
    storage: b.storage.map((id) => getPart(id, 'storage')).filter((x): x is NonNullable<typeof x> => !!x),
    psu: getPart(b.psu, 'psu'),
    case: getPart(b.case, 'case'),
    fans: getPart(b.fans, 'fans'),
  }
}

export function partsInBuild(r: ResolvedBuild): Part[] {
  const out: Part[] = []
  for (const k of ['cpu', 'cooler', 'motherboard', 'ram', 'gpu', 'psu', 'case', 'fans'] as const) {
    const p = r[k]
    if (p) out.push(p)
  }
  return [...out, ...r.storage]
}

export function totalPrice(r: ResolvedBuild): number {
  return partsInBuild(r).reduce((s, p) => s + p.price, 0)
}

export function hasCategory(r: ResolvedBuild, c: Category): boolean {
  if (c === 'storage') return r.storage.length > 0
  return !!r[c]
}

/** returns a new build with the part put into its slot */
export function withPart(b: Build, p: Part): Build {
  if (p.category === 'storage') {
    if (b.storage.includes(p.id)) return b
    return { ...b, storage: [...b.storage, p.id].slice(-4) }
  }
  return { ...b, [p.category]: p.id }
}
