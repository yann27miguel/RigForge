import type { Category, Part } from './types'

/** Chart / accent colour per category, taken from the real material of the part. */
export const CAT_COLOR: Record<Category, string> = {
  cpu: '#a7b1bd', // nickel-plated heat spreader
  cooler: '#c87533', // copper
  motherboard: '#1f8a4c', // PCB green
  ram: '#d946ef', // RGB heat spreader
  gpu: '#7c8cff', // shroud + RGB
  storage: '#0ea5e9', // NAND / M.2
  psu: '#eab308', // 80 PLUS gold label
  case: '#64748b', // tempered glass / steel
  fans: '#22d3ee', // ARGB ring
}

/** Brand accent colours (approximate brand identities, used as small accents only). */
export const BRAND_COLOR: Record<string, string> = {
  NVIDIA: '#76b900', AMD: '#ed1c24', Intel: '#0071c5',
  ASUS: '#1f6feb', MSI: '#e60012', Gigabyte: '#ff6a00', ASRock: '#2bb3e6',
  Sapphire: '#2563eb', PowerColor: '#dc2626', XFX: '#ef4444',
  Kingston: '#e31837', Patriot: '#c8102e', Corsair: '#f5c400', TeamGroup: '#e11d48', 'G.Skill': '#c9a227',
  Samsung: '#1428a0', WD: '#8b5cf6', Lexar: '#0a7fd4', Seagate: '#6ebe49',
  'be quiet!': '#f39200', Seasonic: '#0066b3',
  'Fractal Design': '#b08d57', 'Lian Li': '#9ca3af', NZXT: '#8b5cf6', Phanteks: '#e10600', Jonsbo: '#94a3b8', 'Cooler Master': '#7c3aed',
  Thermalright: '#0ea5e9', Noctua: '#8a5a3c', Arctic: '#00a5e3',
}

export function brandColor(p: Part): string {
  if (p.category === 'gpu') return BRAND_COLOR[p.maker] ?? '#94a3b8'
  return BRAND_COLOR[p.brand] ?? '#94a3b8'
}
