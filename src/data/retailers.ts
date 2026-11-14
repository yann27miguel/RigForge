import type { Lang } from '../i18n'
import type { Part } from './types'

export interface Retailer {
  id: string
  name: string
  kind: 'compare' | 'shop'
  langs?: Lang[]
  url: (q: string) => string
}

const enc = encodeURIComponent

/** Search links only – we never invent product URLs, so links never break when listings change. */
export const RETAILERS: Retailer[] = [
  { id: 'geizhals', name: 'Geizhals', kind: 'compare', url: (q) => `https://geizhals.de/?fs=${enc(q)}` },
  { id: 'idealo', name: 'idealo', kind: 'compare', url: (q) => `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${enc(q)}` },
  { id: 'pcpartpicker', name: 'PCPartPicker (DE)', kind: 'compare', url: (q) => `https://de.pcpartpicker.com/search/?q=${enc(q)}` },
  { id: 'amazon', name: 'Amazon.de', kind: 'shop', url: (q) => `https://www.amazon.de/s?k=${enc(q)}` },
  { id: 'alternate', name: 'Alternate', kind: 'shop', url: (q) => `https://www.alternate.de/listing.xhtml?q=${enc(q)}` },
  { id: 'mindfactory', name: 'Mindfactory', kind: 'shop', url: (q) => `https://www.mindfactory.de/search_result.php?search_query=${enc(q)}` },
  { id: 'caseking', name: 'Caseking', kind: 'shop', url: (q) => `https://www.caseking.de/search?search=${enc(q)}` },
  { id: 'ldlc', name: 'LDLC (FR)', kind: 'shop', langs: ['fr'], url: (q) => `https://www.ldlc.com/recherche/${enc(q)}/` },
  { id: 'amazonfr', name: 'Amazon.fr', kind: 'shop', langs: ['fr'], url: (q) => `https://www.amazon.fr/s?k=${enc(q)}` },
]

export const BRAND_SITES: Record<string, string> = {
  AMD: 'https://www.amd.com',
  Intel: 'https://www.intel.com',
  NVIDIA: 'https://www.nvidia.com',
  ASUS: 'https://www.asus.com',
  MSI: 'https://www.msi.com',
  Gigabyte: 'https://www.gigabyte.com',
  ASRock: 'https://www.asrock.com',
  Sapphire: 'https://www.sapphiretech.com',
  PowerColor: 'https://www.powercolor.com',
  XFX: 'https://www.xfxforce.com',
  Kingston: 'https://www.kingston.com',
  Patriot: 'https://www.patriotmemory.com',
  Corsair: 'https://www.corsair.com',
  TeamGroup: 'https://www.teamgroupinc.com',
  'G.Skill': 'https://www.gskill.com',
  Samsung: 'https://semiconductor.samsung.com/consumer-storage/',
  WD: 'https://www.westerndigital.com',
  Lexar: 'https://www.lexar.com',
  Seagate: 'https://www.seagate.com',
  'be quiet!': 'https://www.bequiet.com',
  Seasonic: 'https://seasonic.com',
  'Fractal Design': 'https://www.fractal-design.com',
  'Lian Li': 'https://lian-li.com',
  NZXT: 'https://nzxt.com',
  Phanteks: 'https://phanteks.com',
  Jonsbo: 'https://www.jonsbo.com',
  'Cooler Master': 'https://www.coolermaster.com',
  Thermalright: 'https://www.thermalright.com',
  Noctua: 'https://www.noctua.at',
  Arctic: 'https://www.arctic.de',
}

export function searchQuery(p: Part): string {
  if (p.category === 'gpu') return `${p.chip} ${p.brand} ${p.name.replace(p.chip, '').trim()}`.replace(/\s+/g, ' ')
  // strip parenthesised colour / notes for better search hits
  return `${p.brand} ${p.name.replace(/\(.*?\)/g, '')}`.replace(/\s+/g, ' ').trim()
}

export function retailersFor(lang: Lang): Retailer[] {
  return RETAILERS.filter((r) => !r.langs || r.langs.includes(lang))
}

export function reviewLink(p: Part): string {
  return `https://www.youtube.com/results?search_query=${enc(searchQuery(p) + ' review')}`
}

export function makerSite(p: Part): string | undefined {
  if (p.category === 'gpu') return BRAND_SITES[p.brand] ?? BRAND_SITES[p.maker]
  return BRAND_SITES[p.brand]
}

export interface Reference {
  name: string
  url: string
  topic: 'prices' | 'specs' | 'reviews' | 'psu' | 'guides' | 'builders'
  lang: string
}

export const REFERENCES: Reference[] = [
  { name: 'Geizhals – price comparison (DE/AT)', url: 'https://geizhals.de', topic: 'prices', lang: 'DE' },
  { name: 'idealo – price comparison', url: 'https://www.idealo.de', topic: 'prices', lang: 'DE' },
  { name: 'PCPartPicker – part lists & price history', url: 'https://de.pcpartpicker.com', topic: 'builders', lang: 'EN' },
  { name: 'DropReference – price comparison & FPS estimates', url: 'https://dropreference.com', topic: 'builders', lang: 'FR/EN/DE' },
  { name: 'BuildCores – 3D PC builder', url: 'https://www.buildcores.com', topic: 'builders', lang: 'EN' },
  { name: 'NZXT – prebuilt & BLD configurator', url: 'https://nzxt.com/de-intl', topic: 'builders', lang: 'EN/DE' },
  { name: 'Pangoly – builds & price tracking', url: 'https://pangoly.com', topic: 'builders', lang: 'EN' },
  { name: 'PC-Kombo – compatibility-aware configurator', url: 'https://www.pc-kombo.com', topic: 'builders', lang: 'EN/DE' },
  { name: 'TechPowerUp GPU Database', url: 'https://www.techpowerup.com/gpu-specs/', topic: 'specs', lang: 'EN' },
  { name: 'TechPowerUp CPU Database', url: 'https://www.techpowerup.com/cpu-specs/', topic: 'specs', lang: 'EN' },
  { name: 'Intel ARK – official CPU specs', url: 'https://www.intel.com/content/www/us/en/ark.html', topic: 'specs', lang: 'EN' },
  { name: 'AMD – official product specs', url: 'https://www.amd.com/en/products/specifications.html', topic: 'specs', lang: 'EN' },
  { name: 'PC Games Hardware (PCGH) – tests & price news', url: 'https://www.pcgameshardware.de', topic: 'reviews', lang: 'DE' },
  { name: 'ComputerBase – tests & benchmarks', url: 'https://www.computerbase.de', topic: 'reviews', lang: 'DE' },
  { name: "Tom's Hardware – GPU & CPU hierarchy", url: 'https://www.tomshardware.com', topic: 'reviews', lang: 'EN' },
  { name: 'Gamers Nexus – in-depth reviews', url: 'https://gamersnexus.net', topic: 'reviews', lang: 'EN' },
  { name: 'Hardware Unboxed – benchmarks (YouTube)', url: 'https://www.youtube.com/@Hardwareunboxed', topic: 'reviews', lang: 'EN' },
  { name: 'Cybenetics – independent PSU efficiency & noise ratings', url: 'https://www.cybenetics.com', topic: 'psu', lang: 'EN' },
  { name: 'r/buildapc – community wiki', url: 'https://www.reddit.com/r/buildapc/wiki/index/', topic: 'guides', lang: 'EN' },
]
