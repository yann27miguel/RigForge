import type { Resolution } from '../data/games'
import { CATEGORIES, type Category, type ResolvedBuild } from '../data/types'
import { partsInBuild, totalPrice } from './build'
import { checkBuild } from './compat'
import { estimateAll, scores } from './perf'
import { estimatePower } from './power'

export interface Metrics {
  price: number
  avgFps: number
  fpsByGame: Record<string, number>
  power: number
  gamingDraw: number
  perfPerEuro: number
  radar: { gaming: number; work: number; rt: number; ai: number; value: number; efficiency: number; upgrade: number }
  priceByCat: Record<Category, number>
  errors: number
}

const UPGRADE: Record<string, number> = { AM5: 90, LGA1851: 60, LGA1700: 35, AM4: 25 }

export function metrics(r: ResolvedBuild, res: Resolution, upscaling: boolean, listedPrice?: number): Metrics {
  const price = listedPrice ?? totalPrice(r)
  const est = estimateAll(r, res, upscaling)
  const aaa = est.filter((e) => e.game.genre !== 'esports')
  const avgFps = aaa.length ? aaa.reduce((s, e) => s + e.fps, 0) / aaa.length : 0
  const pw = estimatePower(r)
  // typical gaming draw: CPU rarely hits its peak while the GPU is fully loaded
  const gamingDraw = Math.round((r.cpu?.maxPower ?? 0) * 0.6 + (r.gpu?.tdp ?? 0) * 0.9 + pw.other)
  const sc = scores(r)
  const perfPerEuro = price ? (sc.gaming / price) * 1000 : 0
  let upgrade = r.cpu ? UPGRADE[r.cpu.socket] ?? 40 : 0
  if (r.psu && r.psu.wattage - pw.recommended >= 150) upgrade += 5
  if (r.motherboard && r.motherboard.m2Slots - r.storage.filter((s) => s.formFactor === 'M.2').length >= 1) upgrade += 5
  const priceByCat = Object.fromEntries(CATEGORIES.map((c) => [c, partsInBuild(r).filter((p) => p.category === c).reduce((s, p) => s + p.price, 0)])) as Record<Category, number>
  return {
    price,
    avgFps,
    fpsByGame: Object.fromEntries(est.map((e) => [e.game.id, e.fps])),
    power: pw.total,
    gamingDraw,
    perfPerEuro,
    radar: {
      gaming: sc.gaming,
      work: sc.work,
      rt: sc.rt,
      ai: sc.ai,
      value: Math.min(100, perfPerEuro * 2.2),
      efficiency: gamingDraw ? Math.min(100, (avgFps / gamingDraw) * 200) : 0,
      upgrade: Math.min(100, upgrade),
    },
    priceByCat,
    errors: checkBuild(r).errors,
  }
}

/** yearly electricity cost in EUR for a given daily gaming time and tariff */
export function energyCost(watts: number, hoursPerDay: number, eurPerKwh: number) {
  return (watts / 1000) * hoursPerDay * 365 * eurPerKwh
}
