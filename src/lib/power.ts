import type { ResolvedBuild } from '../data/types'

export interface PowerEstimate {
  cpu: number
  gpu: number
  other: number
  total: number
  recommended: number
}

const roundUp50 = (n: number) => Math.ceil(n / 50) * 50

export function estimatePower(r: ResolvedBuild): PowerEstimate {
  const cpu = r.cpu?.maxPower ?? 0
  const gpu = r.gpu?.tdp ?? 0
  const fanCount = (r.case?.includedFans ?? 0) + (r.fans?.count ?? 0)
  const other =
    (r.motherboard ? 55 : 0) +
    (r.ram ? r.ram.modules * 5 : 0) +
    r.storage.reduce((s, d) => s + (d.kind === 'HDD' ? 9 : 6), 0) +
    fanCount * 3 +
    (r.cooler?.type === 'aio' ? 12 : r.cooler ? 3 : 0) +
    (r.cpu || r.motherboard ? 15 : 0) // USB devices, RGB, losses
  const total = cpu + gpu + other
  // 25 % headroom covers GPU transient spikes and keeps the PSU in its efficient, quiet range
  const recommended = Math.max(roundUp50(total * 1.25), r.gpu?.recommendedPsu ?? 0, total ? 450 : 0)
  return { cpu, gpu, other, total, recommended }
}
