import type { Case, FormFactor, ResolvedBuild } from '../../data/types'

/** 1 scene unit = 100 mm */
export const mm = (v: number) => v / 100

export type V3 = [number, number, number]

export interface Layout {
  D: number
  H: number
  W: number
  sff: boolean
  ff: FormFactor
  mb: { w: number; h: number; backX: number; topY: number; z: number; surface: number }
  uv: (u: number, v: number, dz?: number) => V3
  socket: V3
  socketSize: number
  ramSlots: V3[]
  pcieY: number
  m2: V3[]
  psu: { pos: V3; d: number; h: number; w: number }
  shroudH: number
  fanSize: number
  frontFans: V3[]
  rearFans: V3[]
  topFans: V3[]
  bottomFans: V3[]
  radiator: { pos: V3; len: number } | null
  hdd: V3
  sata: V3
}

const DEFAULT_CASE: Pick<Case, 'dims' | 'size'> = { dims: { d: 447, h: 469, w: 215 }, size: 'mid' }

const MB_DIMS: Record<FormFactor, { w: number; h: number }> = {
  'E-ATX': { w: 244, h: 305 },
  ATX: { w: 244, h: 305 },
  mATX: { w: 244, h: 244 },
  ITX: { w: 170, h: 170 },
}

export function computeLayout(r: ResolvedBuild): Layout {
  const c = r.case ?? DEFAULT_CASE
  const sff = c.size === 'sff'
  const D = mm(c.dims.d)
  const H = mm(c.dims.h)
  const W = mm(c.dims.w)
  let ff: FormFactor = r.motherboard?.formFactor ?? (sff ? 'ITX' : 'ATX')
  if (ff === 'E-ATX') ff = 'ATX'
  const md = MB_DIMS[ff]
  const backX = D / 2 - mm(14)
  const topY = H - mm(sff ? 18 : 48)
  const z = -W / 2 + mm(sff ? 16 : 22)
  const surface = z + mm(16)
  const mb = { w: mm(md.w), h: mm(md.h), backX, topY, z, surface }
  const uv = (u: number, v: number, dz = 0): V3 => [backX - mm(u), topY - mm(v), surface + dz]

  const socketUV = ff === 'ITX' ? [78, 64] : ff === 'mATX' ? [96, 86] : [100, 90]
  const socket = uv(socketUV[0], socketUV[1])
  const ramU = ff === 'ITX' ? [140, 150] : [166, 175, 189, 198]
  const ramSlots = ramU.map((u) => uv(u, 86))
  const pcieV = ff === 'ITX' ? 150 : ff === 'mATX' ? 140 : 150
  const pcieY = topY - mm(pcieV)
  const m2UV = ff === 'ITX' ? [[48, 112]] : ff === 'mATX' ? [[58, 122], [58, 196]] : [[58, 124], [58, 206], [58, 258]]
  const m2 = m2UV.map(([u, v]) => uv(u, v))

  const psuW = r.psu?.formFactor === 'SFX' ? 125 : 150
  const psuH = r.psu?.formFactor === 'SFX' ? 63.5 : 86
  const psuD = r.psu?.formFactor === 'SFX' ? 100 : r.psu && r.psu.wattage >= 1000 ? 170 : 150
  const psu = sff
    ? { pos: [-D / 2 + mm(14 + psuD / 2), H - mm(26 + psuH / 2), mm(10)] as V3, d: mm(psuD), h: mm(psuH), w: mm(psuW) }
    : { pos: [D / 2 - mm(14 + psuD / 2), mm(10 + psuH / 2), -W / 2 + mm(18 + psuW / 2) * 0.9] as V3, d: mm(psuD), h: mm(psuH), w: mm(psuW) }
  const shroudH = sff ? 0 : mm(108)

  const fanSize = mm(r.fans?.sizeMm ?? 120)
  const totalFans = Math.min((r.case?.includedFans ?? 2) + (r.fans?.count ?? 0), r.case?.maxFans ?? 3)
  const frontFans: V3[] = []
  const rearFans: V3[] = []
  const topFans: V3[] = []
  const bottomFans: V3[] = []
  let left = totalFans
  const aio = r.cooler?.type === 'aio'
  if (sff) {
    const n = Math.min(left, 2)
    for (let i = 0; i < n; i++) bottomFans.push([D / 2 - mm(40) - fanSize / 2 - i * (fanSize + mm(8)), mm(16), mm(-2)])
  } else {
    const frontSlots = Math.max(1, Math.min(3, Math.floor((H - mm(30)) / (fanSize + mm(10)))))
    const nf = Math.min(left, frontSlots)
    for (let i = 0; i < nf; i++) frontFans.push([-D / 2 + mm(26), H - mm(40) - fanSize / 2 - i * (fanSize + mm(10)), mm(0)])
    left -= nf
    if (left > 0) {
      rearFans.push([D / 2 - mm(26), topY - mm(10) - fanSize / 2, (surface + W / 2) / 2 - mm(8)])
      left -= 1
    }
    if (left > 0 && !aio) {
      const nt = Math.min(left, 2)
      for (let i = 0; i < nt; i++) topFans.push([D / 2 - mm(60) - fanSize / 2 - mm(30) - i * (fanSize + mm(10)), H - mm(26), (surface + W / 2) / 2])
    }
  }
  let radiator: Layout['radiator'] = null
  if (aio && r.cooler?.radiatorMm) {
    const len = mm(r.cooler.radiatorMm + 36)
    radiator = { pos: [Math.min(D / 2 - mm(50) - len / 2, 0), H - mm(sff ? 24 : 30), (surface + W / 2) / 2], len }
  }
  return {
    D, H, W, sff, ff, mb, uv, socket, socketSize: mm(r.cpu?.socket?.startsWith('LGA') ? 45 : 40), ramSlots, pcieY, m2, psu, shroudH,
    fanSize, frontFans, rearFans, topFans, bottomFans, radiator,
    hdd: [-D / 2 + mm(110), mm(20), mm(0)],
    sata: [-D / 2 + mm(120), shroudH + mm(6), mm(10)],
  }
}
