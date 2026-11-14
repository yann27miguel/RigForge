import { LEGACY_PARTS, PARTS } from '../data/parts'
import type { Build, Category, CPU, GPU, MemType, Part, Socket } from '../data/types'

export interface Detected {
  cat: Category
  id: string
  match: string
  exact: boolean
}

export interface ParsedPC {
  build: Build
  detected: Detected[]
  price?: number
  title?: string
}

const norm = (s: string) => s.toLowerCase().replace(/[®™©]/g, '').replace(/\s+/g, ' ')
const key = (s: string) => s.toLowerCase().replace(/geforce|radeon|intel|amd|core|ryzen|[^a-z0-9]/g, '')

/* ---------------- GPU ---------------- */
const allGpus = [...PARTS, ...LEGACY_PARTS].filter((p): p is GPU => p.category === 'gpu')
/** chip key → preferred part (catalog first, non-white first) */
const gpuIndex = new Map<string, GPU>()
for (const g of [...allGpus].sort((a, b) => Number(!!a.legacy) - Number(!!b.legacy) || Number(a.color === 'white') - Number(b.color === 'white'))) {
  const k = key(g.chip.replace(/\s16gb|\s12gb|\s8gb/i, ''))
  if (!gpuIndex.has(k)) gpuIndex.set(k, g)
}
const GPU_RE = /\b(?:geforce\s*)?(rtx|gtx)\s*-?\s*(\d{4})\s*(ti\s*super|ti|super)?\b|\b(?:radeon\s*)?rx\s*-?\s*(\d{4})\s*(xtx|xt|gre)?\b|\barc\s*([ab]\d{3})\b/gi

function findGpu(t: string): Detected | null {
  for (const m of t.matchAll(GPU_RE)) {
    let k = ''
    if (m[1]) k = `${m[1]}${m[2]}${(m[3] ?? '').replace(/\s/g, '')}`
    else if (m[4]) k = `rx${m[4]}${m[5] ?? ''}`
    else if (m[6]) k = `arc${m[6]}`
    k = k.toLowerCase()
    const g = gpuIndex.get(k)
    if (g) return { cat: 'gpu', id: g.id, match: m[0].trim(), exact: true }
  }
  return null
}

/* ---------------- CPU ---------------- */
const allCpus = [...PARTS, ...LEGACY_PARTS].filter((p): p is CPU => p.category === 'cpu')
const cpuIndex = new Map<string, CPU>()
for (const c of allCpus) {
  const m = c.name.match(/(\d{3,5}[a-z0-9]*)$/i)
  if (!m) continue
  const tier = c.name.match(/Ryzen (\d)|i(\d)-|Ultra (\d)/i)
  const fam = c.brand === 'AMD' ? 'r' : c.name.includes('Ultra') ? 'u' : 'i'
  const k = `${fam}${tier?.[1] ?? tier?.[2] ?? tier?.[3] ?? ''}${m[1].toLowerCase()}`
  if (!cpuIndex.has(k) || !c.legacy) cpuIndex.set(k, c)
}
const CPU_RE = /\bryzen\s*([3579])\s*(\d{4}(?:x3d|xt|x|f|g)?)\b|\b(?:core\s*)?i([3579])\s*-?\s*(\d{4,5}(?:kf|ks|k|f|t)?)\b|\b(?:core\s*)?ultra\s*([579])\s*(\d{3}(?:kf|k|f|t)?)\b/gi

function findCpu(t: string): Detected | null {
  for (const m of t.matchAll(CPU_RE)) {
    let k = ''
    if (m[1]) k = `r${m[1]}${m[2]}`
    else if (m[3]) k = `i${m[3]}${m[4].replace(/kf$/i, 'k')}`
    else if (m[5]) k = `u${m[5]}${m[6].replace(/kf$/i, 'k')}`
    k = k.toLowerCase()
    const c = cpuIndex.get(k) ?? cpuIndex.get(k.replace(/f$/, '')) ?? cpuIndex.get(k + 'f')
    if (c) return { cat: 'cpu', id: c.id, match: m[0].trim(), exact: cpuIndex.has(k) }
  }
  return null
}

/* ---------------- RAM / storage / PSU / board / cooler / case ---------------- */
function findRam(t: string, cpu?: CPU): Detected | null {
  // 1) "32GB DDR5-6000" – capacity right before the DDR type (avoids picking up VRAM like "RTX 4070 12GB")
  let m = t.match(/(\d{1,3})\s*gb\s*(?:ram\s*|arbeitsspeicher\s*|[(\-]\s*)?ddr\s?([45])(?:[-\s]?(\d{4}))?/i)
  let gb = 0
  let type: MemType | undefined
  let speed: number | undefined
  if (m) {
    gb = Number(m[1])
    type = `DDR${m[2]}` as MemType
    speed = Number(m[3]) || undefined
  } else if ((m = t.match(/ddr\s?([45])(?:[-\s]?(\d{4}))?(?:\s*mhz|\s*mt\/s)?[^\d|/,;]{0,12}(\d{1,3})\s*gb/i))) {
    type = `DDR${m[1]}` as MemType
    speed = Number(m[2]) || undefined
    gb = Number(m[3])
  } else {
    const r = t.match(/(\d{1,3})\s*gb\s*(?:ram|arbeitsspeicher|mémoire|memory|de ram)/i) ?? t.match(/(?:ram|arbeitsspeicher|mémoire|memory)[:\s]*(\d{1,3})\s*gb/i)
    if (!r) return null
    gb = Number(r[1])
    type = /ddr\s?4/i.test(t) ? 'DDR4' : /ddr\s?5/i.test(t) ? 'DDR5' : cpu?.memTypes[0] ?? 'DDR5'
  }
  if (!gb || gb < 4 || gb > 256) return null
  const exact = PARTS.find((p) => p.category === 'ram' && p.memType === type && p.capacityGB === gb && (!speed || p.speed === speed))
  return { cat: 'ram', id: exact?.id ?? `x:ram:${type}:${gb}${speed ? ':' + speed : ''}`, match: m?.[0]?.trim() ?? `${gb} GB`, exact: !!exact }
}

function findStorage(t: string): Detected[] {
  const out: Detected[] = []
  const re = /(\d+(?:[.,]\d+)?)\s*(tb|gb)\s*(?:[a-z0-9.\-]*\s){0,3}?(nvme|m\.2|pcie\s*(?:gen\s*)?[345](?:\.0)?|ssd|hdd|festplatte|sata)/gi
  for (const m of t.matchAll(re)) {
    const n = Number(m[1].replace(',', '.'))
    const gb = m[2].toLowerCase() === 'tb' ? Math.round(n * 1000) : Math.round(n)
    if (gb < 120 || gb > 24000) continue
    const tok = m[3].toLowerCase()
    const kind = /hdd|festplatte/.test(tok) ? 'hdd' : /sata/.test(tok) || (tok === 'ssd' && /sata/.test(t) && !/nvme|m\.2/.test(t)) ? 'sata' : /gen\s*5|pcie\s*5/.test(tok) ? 'gen5' : /gen\s*3|pcie\s*3/.test(tok) ? 'gen3' : 'nvme'
    const id = `x:storage:${kind}:${gb}`
    if (!out.some((d) => d.id === id)) out.push({ cat: 'storage', id, match: m[0].trim(), exact: false })
    if (out.length >= 3) break
  }
  // bare "2TB" values (e.g. "2TB + 4TB HDD") are almost always the NVMe system drive
  for (const m of t.matchAll(/(\d{1,2})\s*tb\b/gi)) {
    const gb = Number(m[1]) * 1000
    if (out.some((d) => d.id.endsWith(':' + gb))) continue
    out.unshift({ cat: 'storage', id: `x:storage:nvme:${gb}`, match: m[0], exact: false })
    break
  }
  return out.slice(0, 3)
}

function findPsu(t: string): Detected | null {
  const m = t.match(/(\d{3,4})\s*(?:w|watt)\b[^.\n]{0,30}?(?:80\s*\+?\s*(?:plus)?\s*(bronze|gold|platinum|titanium))?/i) ?? t.match(/(?:netzteil|psu|power supply|alimentation)[^0-9]{0,25}(\d{3,4})\s*w/i)
  if (!m) return null
  const w = Number(m[1])
  if (w < 300 || w > 2000) return null
  const eff = (m[2] ?? (/80\s*\+?\s*(?:plus)?\s*gold/i.test(t) ? 'gold' : /bronze/i.test(t) ? 'bronze' : 'gold')).toLowerCase()
  return { cat: 'psu', id: `x:psu:${w}:${eff}`, match: m[0].trim(), exact: false }
}

const CHIPSET_SOCKET: [RegExp, Socket][] = [
  [/\b(x870e?|b850|b840|x670e?|b650e?|a620)\b/i, 'AM5'],
  [/\b(x570|b550|a520|b450|x470)\b/i, 'AM4'],
  [/\b(z890|b860|h810)\b/i, 'LGA1851'],
  [/\b(z790|b760|h770|h610|z690|b660)\b/i, 'LGA1700'],
]

function findBoard(t: string, cpu?: CPU, ram?: Detected | null): Detected | null {
  let socket: Socket | undefined = cpu?.socket
  let match = ''
  for (const [re, s] of CHIPSET_SOCKET) {
    const m = t.match(re)
    if (m) {
      socket = s
      match = m[0]
      break
    }
  }
  if (!socket) return null
  const mem: MemType = ram?.id.includes('DDR4') ? 'DDR4' : ram?.id.includes('DDR5') ? 'DDR5' : socket === 'AM4' ? 'DDR4' : 'DDR5'
  const ff = /mini[-\s]?itx|\bitx\b/i.test(t) ? 'ITX' : /m-?atx|micro[-\s]?atx|\bµatx/i.test(t) ? 'mATX' : 'ATX'
  return { cat: 'motherboard', id: `x:mb:${socket}:${mem}:${ff}`, match: match || socket, exact: false }
}

function findCooler(t: string): Detected | null {
  const kw = '(?:aio|all[-\\s]in[-\\s]one|wasserkühlung|watercooling|watercooler|liquid\\s*cool\\w*|refroidissement liquide)'
  const before = t.match(new RegExp(`(240|280|360|420)\\s*mm[^,|/\\n]{0,15}?${kw}`, 'i'))
  const m = before ?? t.match(new RegExp(`${kw}[^,|/\\n]{0,30}?(240|280|360|420)?`, 'i'))
  if (m) return { cat: 'cooler', id: `x:cooler:aio:${m[1] ?? 240}`, match: m[0].trim(), exact: false }
  const a = t.match(/(?:tower[-\s]?kühler|luftkühler|air cooler|ventirad|cpu[-\s]?kühler)/i)
  return a ? { cat: 'cooler', id: 'x:cooler:air', match: a[0], exact: false } : null
}

function findCase(t: string, board: Detected | null): Detected {
  const ff = board?.id.split(':')[4] ?? (/mini[-\s]?itx/i.test(t) ? 'ITX' : 'ATX')
  return { cat: 'case', id: `x:case:${ff}`, match: ff, exact: false }
}

/** Finds a plausible price in EUR (or USD) in shop-page text. */
export function findPrice(t: string): number | undefined {
  const usd = t.match(/\$\s?(\d{1,2},\d{3}|\d{3,4})(?:\.\d{2})?/)
  const re = /(?:€\s*)(\d{1,2}[.\s]?\d{3}|\d{3,4})(?:[,.](\d{2}))?|(\d{1,2}[.\s]?\d{3}|\d{3,4})(?:,(\d{2}))?\s*(?:€|eur\b)/gi
  for (const m of t.matchAll(re)) {
    const whole = (m[1] ?? m[3]).replace(/[.\s]/g, '')
    const v = Number(whole)
    if (v >= 300 && v <= 20000) return v
  }
  if (usd) {
    const v = Number(usd[1].replace(',', ''))
    if (v >= 300 && v <= 20000) return v
  }
  return undefined
}

/** Turns free text (product title, spec sheet, shop page) into a build. */
export function parsePC(raw: string, hint?: { title?: string; price?: number }): ParsedPC {
  const t = norm(raw)
  const detected: Detected[] = []
  const cpuD = findCpu(t)
  const cpu = cpuD ? (allCpus.find((c) => c.id === cpuD.id) as CPU) : undefined
  const gpuD = findGpu(t)
  const ramD = findRam(t, cpu)
  const storage = findStorage(t)
  const psuD = findPsu(t)
  const boardD = findBoard(t, cpu, ramD)
  const coolerD = findCooler(t)
  for (const d of [cpuD, gpuD, ramD, boardD, coolerD, psuD]) if (d) detected.push(d)
  detected.push(...storage)
  const caseD = cpuD || gpuD ? findCase(t, boardD) : null
  if (caseD) detected.push(caseD)
  const build: Build = { storage: storage.map((s) => s.id) }
  for (const d of detected) if (d.cat !== 'storage') (build as unknown as Record<string, string>)[d.cat] = d.id
  return { build, detected, price: hint?.price ?? findPrice(raw), title: hint?.title }
}

export function partFromDetected(d: Detected, lookup: (id: string) => Part | undefined): Part | undefined {
  return lookup(d.id)
}
