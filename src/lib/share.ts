import { displayName } from '../data/parts'
import type { Build, ResolvedBuild } from '../data/types'
import { partsInBuild, totalPrice } from './build'
import { eur } from './format'
import type { Lang } from '../i18n'

const KEYS: Record<string, keyof Build> = { c: 'cpu', k: 'cooler', m: 'motherboard', r: 'ram', g: 'gpu', p: 'psu', x: 'case', f: 'fans' }

/** compact, human-readable query string, e.g. c=r7-9800x3d&g=rtx5080&s=wd-sn850x-1tb */
export function encodeBuild(b: Build): string {
  const q = new URLSearchParams()
  for (const [short, key] of Object.entries(KEYS)) {
    const v = b[key]
    if (typeof v === 'string') q.set(short, v)
  }
  if (b.storage.length) q.set('s', b.storage.join(','))
  return q.toString()
}

export function decodeBuild(qs: string): Build | null {
  const q = new URLSearchParams(qs)
  const b: Build = { storage: [] }
  let any = false
  for (const [short, key] of Object.entries(KEYS)) {
    const v = q.get(short)
    if (v) {
      ;(b as unknown as Record<string, string>)[key] = v
      any = true
    }
  }
  const s = q.get('s')
  if (s) {
    b.storage = s.split(',').filter(Boolean)
    any = true
  }
  return any ? b : null
}

export function shareUrl(b: Build): string {
  const base = window.location.href.split('#')[0]
  return `${base}#/builder?${encodeBuild(b)}`
}

export function toMarkdown(r: ResolvedBuild, lang: Lang, url: string, catLabel: (c: string) => string, priceNote: string): string {
  const rows = partsInBuild(r).map((p) => `| ${catLabel(p.category)} | ${displayName(p)} | ${eur(p.price, lang)} |`)
  return [
    `**RigForge build** – ${url}`,
    '',
    '| Type | Item | Price |',
    '| :--- | :--- | ---: |',
    ...rows,
    `| | **Total** | **${eur(totalPrice(r), lang)}** |`,
    '',
    `_${priceNote}_`,
  ].join('\n')
}
