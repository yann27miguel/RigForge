import { GAMES, type Resolution } from '../data/games'
import { partsOf } from '../data/parts'
import { CATEGORIES, type Build, type Case, type Category, type Color, type Cooler, type CPU, type FormFactor, type GPU, type MemType, type Motherboard, type PSU, type RAM, type ResolvedBuild, type Storage } from '../data/types'
import { partsInBuild, resolve, totalPrice } from './build'
import { checkBuild } from './compat'
import { estimateGame } from './perf'
import { estimatePower } from './power'

export type UseCase = 'esports' | 'gaming1440' | 'gaming4k' | 'streaming' | 'creator' | 'office' | 'ai'

export interface WizardInput {
  budget: number
  useCase: UseCase
  platform: 'any' | 'amd' | 'intel'
  color: 'any' | Color
  size: 'any' | 'compact' | 'sff'
  wifi: boolean
  rgb: boolean
  /** parts the user already owns – they cost nothing and are reused when compatible */
  owned?: Build
}

export interface WizardResult {
  build: Build
  total: number
  score: number
  minBudget: number
  /** categories where an owned part is reused */
  reused: Category[]
  /** categories where an owned part could not be reused (incompatible / too weak) */
  replaced: Category[]
}

const cheapest = <T extends { price: number }>(xs: T[]): T | undefined => xs.reduce<T | undefined>((a, b) => (!a || b.price < a.price ? b : a), undefined)

function ramTarget(u: UseCase, budget: number): number {
  if (u === 'creator' || u === 'ai') return budget >= 2200 ? 64 : 32
  if (u === 'office') return 16
  return budget < 900 ? 16 : 32
}

function storageFor(u: UseCase, budget: number): Storage[] {
  const all = partsOf('storage')
  const get = (id: string) => all.find((s) => s.id === id)!
  if (u === 'ai') return [get(budget > 2500 ? 'lexar-nm790-4tb' : 'lexar-nm790-2tb')]
  if (u === 'creator') return budget > 2500 ? [get('samsung-990pro-2tb'), get('seagate-barracuda-4tb')] : [get('lexar-nm790-2tb')]
  if (u === 'office') return [get('kingston-nv3-1tb')]
  if (budget >= 4000) return [get('samsung-990pro-2tb')]
  if (budget >= 1500) return [get('lexar-nm790-2tb')]
  return [get('kingston-nv3-1tb')]
}

function formFactorsFor(size: WizardInput['size']): FormFactor[] {
  if (size === 'sff') return ['ITX']
  if (size === 'compact') return ['mATX', 'ITX']
  return ['ATX', 'mATX', 'ITX']
}

function colorOk(p: { color?: Color }, want: WizardInput['color']): boolean {
  if (want === 'any') return true
  if (want === 'white') return p.color === 'white'
  return p.color !== 'white'
}

const gm = (xs: number[]) => Math.exp(xs.reduce((a, b) => a + Math.log(Math.max(1, b)), 0) / xs.length)

function scoreBuild(u: UseCase, r: ResolvedBuild): number {
  const { cpu, gpu, ram } = r
  if (!cpu) return 0
  const fps = (res: Resolution, genres: string[], up = false) =>
    gm(GAMES.filter((g) => genres.includes(g.genre)).map((g) => estimateGame(g, cpu, gpu, ram, res, up)?.fps ?? 1))
  switch (u) {
    case 'esports': return fps('1080p', ['esports'])
    case 'gaming1440': return fps('1440p', ['aaa', 'rpg', 'sim'])
    case 'gaming4k': return fps('4k', ['aaa', 'rpg'], true)
    case 'streaming': return fps('1440p', ['aaa', 'esports']) * 0.65 + cpu.multi * 0.9
    case 'creator': return cpu.multi * 1.2 + (gpu?.gaming ?? 0) * 0.5 + (gpu?.maker === 'NVIDIA' ? 8 : 0) + (ram?.capacityGB ?? 0) / 4
    case 'ai': return (gpu ? gpu.vramGB * 4 + gpu.gaming * 0.6 + (gpu.maker === 'NVIDIA' ? 25 : 0) : 0) + (ram?.capacityGB ?? 0) / 4 + cpu.multi * 0.15
    case 'office': return Math.min(cpu.multi, 40) * 0.5 + Math.min(cpu.gaming, 72) * 0.5 + (gpu ? 0 : 15) - totalPrice(r) / 60
  }
}

function assemble(input: WizardInput, cpu: CPU, gpu: GPU | undefined, O: ResolvedBuild): ResolvedBuild | null {
  const ffs = formFactorsFor(input.size).filter((f) => !O.case || O.case.supports.includes(f))
  if (O.case && gpu && gpu.lengthMm > O.case.maxGpuMm) return null
  const target = ramTarget(input.useCase, input.budget)
  let best: { mb: Motherboard; ram: RAM } | null = null
  if (O.motherboard) {
    if (O.motherboard.socket !== cpu.socket || !cpu.memTypes.includes(O.motherboard.memType)) return null
    const mt = O.motherboard.memType
    const ram = O.ram?.memType === mt ? O.ram : cheapest(partsOf('ram').filter((r) => r.memType === mt && r.capacityGB === target)) ?? cheapest(partsOf('ram').filter((r) => r.memType === mt))
    if (!ram) return null
    best = { mb: O.motherboard, ram }
  }
  const memTypes = (O.ram && cpu.memTypes.includes(O.ram.memType) ? [O.ram.memType] : cpu.memTypes) as MemType[]
  for (const mt of best ? [] : memTypes) {
    const mbs = partsOf('motherboard').filter((m) => m.socket === cpu.socket && m.memType === mt && ffs.includes(m.formFactor) && (!input.wifi || m.wifi) && !(m.vrm === 'basic' && cpu.maxPower > 180))
    const mbPick = cheapest(mbs.filter((m) => colorOk(m, input.color))) ?? (input.color === 'white' ? cheapest(mbs) : undefined)
    const rams = partsOf('ram').filter((r) => r.memType === mt && r.capacityGB === target && (!input.rgb || r.rgb || input.budget < 1500))
    const ramPick = (O.ram?.memType === mt ? O.ram : undefined) ?? cheapest(rams.filter((r) => colorOk(r, input.color))) ?? cheapest(rams) ?? cheapest(partsOf('ram').filter((r) => r.memType === mt))
    if (mbPick && ramPick && (!best || mbPick.price + ramPick.price < best.mb.price + best.ram.price)) best = { mb: mbPick, ram: ramPick }
  }
  if (!best) return null
  const { mb, ram } = best
  const storage = O.storage.length ? O.storage : storageFor(input.useCase, input.budget)
  const caseOk = (c: Case) =>
    c.supports.includes(mb.formFactor) &&
    (!gpu || gpu.lengthMm <= c.maxGpuMm - 5) &&
    c.drive35 >= storage.filter((s) => s.formFactor === '3.5"').length &&
    (input.size === 'any' ? c.size !== 'sff' : input.size === 'compact' ? c.size !== 'full' : c.size === 'sff')
  const cases = partsOf('case').filter(caseOk)
  const pcCase = O.case ?? cheapest(cases.filter((c) => colorOk(c, input.color) && (!input.rgb || c.rgb || c.includedFans === 0))) ?? cheapest(cases.filter((c) => colorOk(c, input.color))) ?? cheapest(cases)
  if (!pcCase) return null
  let cooler: Cooler | undefined = O.cooler && O.cooler.sockets.includes(cpu.socket) && (O.cooler.type === 'air' ? (O.cooler.heightMm ?? 0) <= pcCase.maxCoolerMm : (O.cooler.radiatorMm ?? 0) <= pcCase.maxRadiatorMm) ? O.cooler : undefined
  const needCooler = !cooler && !(cpu.boxedCooler && cpu.maxPower <= 90 && input.useCase !== 'creator')
  if (needCooler) {
    const fit = partsOf('cooler').filter(
      (c) => c.sockets.includes(cpu.socket) && c.tdpRating >= cpu.maxPower && (c.type === 'air' ? (c.heightMm ?? 0) <= pcCase.maxCoolerMm : (c.radiatorMm ?? 0) <= pcCase.maxRadiatorMm),
    )
    cooler = cheapest(fit.filter((c) => colorOk(c, input.color) && (!input.rgb || c.rgb))) ?? cheapest(fit)
    if (!cooler) return null
  }
  let fans = O.fans as ResolvedBuild['fans']
  if (!fans && pcCase.maxFans > 0 && (pcCase.includedFans < 2 || (input.rgb && !pcCase.rgb))) {
    const fs = partsOf('fans').filter((f) => (!input.rgb || f.rgb) && pcCase.includedFans + f.count <= pcCase.maxFans)
    fans = cheapest(fs.filter((f) => colorOk(f, input.color))) ?? cheapest(fs)
  }
  const draft: ResolvedBuild = { cpu, gpu, motherboard: mb, ram, storage, case: pcCase, cooler, fans }
  const pw = estimatePower(draft)
  const psus = partsOf('psu').filter((p: PSU) => p.wattage >= pw.recommended && pcCase.psuForms.includes(p.formFactor) && (gpu?.power !== '12V-2x6' || p.native12V2x6) && !(p.efficiency === '80+ Bronze' && pw.total > 400))
  const ownedOk = O.psu && O.psu.wattage >= pw.recommended && pcCase.psuForms.includes(O.psu.formFactor)
  const psu = ownedOk ? O.psu : cheapest(psus)
  if (!psu) return null
  return { ...draft, psu }
}

function toBuild(r: ResolvedBuild): Build {
  return { cpu: r.cpu?.id, cooler: r.cooler?.id, motherboard: r.motherboard?.id, ram: r.ram?.id, gpu: r.gpu?.id, storage: r.storage.map((s) => s.id), psu: r.psu?.id, case: r.case?.id, fans: r.fans?.id }
}

export function recommend(input: WizardInput): WizardResult | null {
  const O = resolve(input.owned ?? { storage: [] })
  const ownedIds = new Set(partsInBuild(O).map((p) => p.id))
  const cost = (r: ResolvedBuild) => partsInBuild(r).filter((p) => !ownedIds.has(p.id)).reduce((s, p) => s + p.price, 0)
  const cpus = O.cpu ? [O.cpu] : partsOf('cpu').filter((c) => (input.platform === 'any' || (input.platform === 'amd' ? c.brand === 'AMD' : c.brand === 'Intel')) && (!O.motherboard || c.socket === O.motherboard.socket))
  const gpuOptions: (GPU | undefined)[] = O.gpu ? [O.gpu] : [undefined, ...partsOf('gpu').filter((g) => input.color !== 'black' || g.color !== 'white')]
  let best: { r: ResolvedBuild; score: number; total: number } | null = null
  let minBudget = Infinity
  for (const cpu of cpus) {
    for (const gpu of gpuOptions) {
      if (!gpu && (!cpu.igpu || (input.useCase !== 'office' && input.useCase !== 'creator'))) continue
      if (gpu && !O.gpu && input.useCase === 'office' && gpu.price > 400) continue
      const r = assemble(input, cpu, gpu, O)
      if (!r) continue
      const total = cost(r)
      minBudget = Math.min(minBudget, total)
      if (total > input.budget) continue
      if (checkBuild(r).errors > 0) continue
      // slight preference for cheaper builds at (almost) equal performance
      const colorBonus = input.color === 'white' && gpu?.color === 'white' ? 1.04 : 1
      const score = scoreBuild(input.useCase, r) * colorBonus - total / 4000
      if (!best || score > best.score) best = { r, score, total }
    }
  }
  if (!best) return minBudget < Infinity ? { build: { storage: [] }, total: 0, score: 0, minBudget, reused: [], replaced: [] } : null
  // spend leftovers on quality-of-life upgrades
  let r = best.r
  const left = () => input.budget - cost(r)
  const upgrades: Array<() => ResolvedBuild | null> = [
    () => {
      if (O.storage.length) return null
      const bigger = partsOf('storage').filter((s) => s.formFactor === 'M.2' && s.capacityGB > (r.storage[0]?.capacityGB ?? 0) && s.price - (r.storage[0]?.price ?? 0) <= left())
      const pick = cheapest(bigger)
      return pick ? { ...r, storage: [pick, ...r.storage.slice(1)] } : null
    },
    () => {
      if (!r.cpu || O.cooler) return null
      const better = partsOf('cooler').filter((c) => c.sockets.includes(r.cpu!.socket) && c.noiseDb < (r.cooler?.noiseDb ?? 30) && c.price - (r.cooler?.price ?? 0) <= left() * 0.6 && colorOk(c, input.color))
      const pick = cheapest(better)
      return pick ? { ...r, cooler: pick } : null
    },
  ]
  // gaming / streaming: spend a large remainder on a faster CPU on the same platform
  if (['esports', 'gaming1440', 'gaming4k', 'streaming'].includes(input.useCase))
    upgrades.unshift(() => {
      if (!r.cpu || O.cpu || left() < 120) return null
      const cur = r.cpu
      const better = partsOf('cpu').filter((c) => c.socket === cur.socket && c.memTypes.some((m) => m === r.ram?.memType) && c.gaming > cur.gaming && c.price - cur.price <= left() * 0.7)
      const pick = better.sort((a, b) => b.gaming - a.gaming || a.price - b.price)[0]
      if (!pick) return null
      const cand: ResolvedBuild = { ...r, cpu: pick }
      if (!cand.cooler || cand.cooler.tdpRating < pick.maxPower * 0.95) {
        const c = partsOf('cooler').filter((k) => k.sockets.includes(pick.socket) && k.tdpRating >= pick.maxPower && (k.type === 'air' ? (k.heightMm ?? 0) <= (r.case?.maxCoolerMm ?? 0) : (k.radiatorMm ?? 0) <= (r.case?.maxRadiatorMm ?? 0)))
        cand.cooler = cheapest(c)
      }
      return cand
    })
  upgrades.push(() => {
    if (!r.case || O.case || left() < 60) return null
    const cur = r.case
    const nicer = partsOf('case').filter((c) => c.id !== cur.id && c.tier !== 'budget' && c.size === cur.size && c.supports.includes(r.motherboard!.formFactor) && (!r.gpu || r.gpu.lengthMm <= c.maxGpuMm - 5) && colorOk(c, input.color) && c.psuForms.includes(r.psu!.formFactor) && c.price - cur.price <= left() * 0.5 && (r.cooler?.type !== 'aio' || (r.cooler.radiatorMm ?? 0) <= c.maxRadiatorMm) && (r.cooler?.type !== 'air' || (r.cooler.heightMm ?? 0) <= c.maxCoolerMm))
    const pick = nicer.sort((a, b) => b.includedFans - a.includedFans || a.price - b.price)[0]
    return pick ? { ...r, case: pick, fans: pick.includedFans >= 2 && !input.rgb ? undefined : r.fans } : null
  })
  for (const up of upgrades) {
    const cand = up()
    if (cand && cost(cand) <= input.budget && checkBuild(cand).errors === 0) r = cand
  }
  const finalIds = new Set(partsInBuild(r).map((p) => p.id))
  const ownedCats = CATEGORIES.filter((c) => (c === 'storage' ? O.storage.length > 0 : !!O[c]))
  const reused = ownedCats.filter((c) => (c === 'storage' ? O.storage.some((s) => finalIds.has(s.id)) : finalIds.has((O[c] as { id: string }).id)))
  const replaced = ownedCats.filter((c) => !reused.includes(c))
  return { build: toBuild(r), total: cost(r), score: best.score, minBudget, reused, replaced }
}
