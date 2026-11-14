import { Check, ChevronDown, GitCompareArrows, ListChecks, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { displayName, partsOf } from '../../data/parts'
import type { Category, Part } from '../../data/types'
import { useT } from '../../i18n'
import { resolve } from '../../lib/build'
import { conflictsWith } from '../../lib/compat'
import { eur } from '../../lib/format'
import { keySpecs, perfValue } from '../../lib/specs'
import { useBuild } from '../../store/build'
import { brandColor } from '../../data/style'
import { BrandChip, CatBadge } from '../icons'
import { PartGuide } from '../PartGuide'
import { PriceLinks } from '../PriceLinks'
import { Badge, Button, Modal, Segmented, cx } from '../ui'

type Sort = 'price' | 'priceDesc' | 'perf' | 'value' | 'name'

export function PartPicker() {
  const { t, lang } = useT()
  const cat = useBuild((s) => s.picking)
  const open = useBuild((s) => s.openPicker)
  return (
    <Modal open={!!cat} onClose={() => open(null)} wide title={cat ? <span className="flex items-center gap-2.5"><CatBadge cat={cat} size={30} />{t('picker.title', { cat: t(`cat.${cat}`) })}</span> : ''}>
      {cat && <PickerBody key={cat + lang} cat={cat} />}
    </Modal>
  )
}

function PickerBody({ cat }: { cat: Category }) {
  const { t, lang } = useT()
  const nav = useNavigate()
  const { build, addPart, openPicker, compare, toggleCompare, setCompare } = useBuild()
  const r = useMemo(() => resolve(build), [build])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>(cat === 'gpu' || cat === 'cpu' ? 'perf' : 'price')
  const [onlyOk, setOnlyOk] = useState(true)
  const [brand, setBrand] = useState('all')
  const [maxPrice, setMaxPrice] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const all = partsOf(cat) as Part[]
  const brands = [...new Set(all.map((p) => (p.category === 'gpu' ? p.maker : p.brand)))].sort()
  const top = Math.max(...all.map((p) => p.price))
  const rows = useMemo(() => {
    const list = all
      .map((p) => ({ p, conflicts: conflictsWith(r, p) }))
      .filter(({ p, conflicts }) => (!onlyOk || conflicts.length === 0) && (brand === 'all' || (p.category === 'gpu' ? p.maker : p.brand) === brand) && (!maxPrice || p.price <= maxPrice) && (!q || displayName(p).toLowerCase().includes(q.toLowerCase())))
    const by: Record<Sort, (a: Part, b: Part) => number> = {
      price: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      perf: (a, b) => perfValue(b) - perfValue(a),
      value: (a, b) => perfValue(b) / b.price - perfValue(a) / a.price,
      name: (a, b) => displayName(a).localeCompare(displayName(b)),
    }
    return list.sort((a, b) => by[sort](a.p, b.p))
  }, [all, r, onlyOk, brand, maxPrice, q, sort])
  const maxPerf = Math.max(...all.map(perfValue))
  const current = cat === 'storage' ? build.storage : [build[cat]]
  const compareInCat = compare.filter((id) => all.some((p) => p.id === id))

  return (
    <div className="grid min-h-0 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="h-10 w-full rounded-xl border border-ink/10 bg-ink/[0.04] pr-3 pl-9 text-sm outline-none focus:border-accent/50" />
          </label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label={t('common.brand')} className="h-10 rounded-xl border border-ink/10 bg-panel2 px-3 text-sm">
            <option value="all">{t('common.brand')}: {t('common.all')}</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-ink/10 bg-ink/[0.04] px-3 text-xs text-mute">
            {t('common.maxPrice')}
            <input type="range" min={0} max={top} step={10} value={maxPrice || top} onChange={(e) => setMaxPrice(Number(e.target.value) >= top ? 0 : Number(e.target.value))} className="w-24" />
            <span className="w-14 text-right font-semibold text-ink tabular-nums">{maxPrice ? eur(maxPrice, lang) : t('common.all')}</span>
          </label>
          <button onClick={() => setOnlyOk(!onlyOk)} className={cx('flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium', onlyOk ? 'border-accent/40 bg-accent/10 text-teal-200' : 'border-ink/10 text-mute')}>
            <Check size={14} />{t('common.onlyCompatible')}
          </button>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Segmented size="sm" value={sort} onChange={setSort} options={[{ id: 'perf', label: t('picker.sortPerf') }, { id: 'value', label: t('picker.sortValue') }, { id: 'price', label: t('picker.sortPrice') }, { id: 'priceDesc', label: t('picker.sortPriceDesc') }]} />
          {compareInCat.length >= 2 && (
            <Button size="sm" variant="soft" onClick={() => { setCompare(compareInCat); openPicker(null); nav('/compare') }}><GitCompareArrows size={14} />{t('picker.compareCount', { n: compareInCat.length })}</Button>
          )}
        </div>
        {rows.length === 0 && <p className="py-10 text-center text-mute">{t('common.noResults')}</p>}
        <ul className="space-y-2">
          {rows.map(({ p, conflicts }) => {
            const inBuild = current.includes(p.id)
            const exp = expanded === p.id
            return (
              <li key={p.id} style={{ borderLeftColor: brandColor(p), borderLeftWidth: 4 }} className={cx('rounded-2xl border transition', inBuild ? 'border-accent/50 bg-accent/[0.06]' : 'border-line bg-panel2/60 hover:border-ink/20')}>
                <div className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{displayName(p)}</span>
                      <BrandChip part={p} />
                      {inBuild && <Badge tone="teal">{t('common.inBuild')}</Badge>}
                      {conflicts.length > 0 ? <Badge tone="red">{t('common.incompatible')}</Badge> : <Badge tone="green">{t('common.compatible')}</Badge>}
                      {p.color === 'white' && <Badge>⚪ white</Badge>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-mute">{keySpecs(p)}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-400" style={{ width: `${(perfValue(p) / maxPerf) * 100}%` }} /></div>
                      <span className="text-[10px] uppercase tracking-wide text-mute">{t('common.perf')}</span>
                    </div>
                    {conflicts.length > 0 && <div className="mt-1 text-xs text-rose-300">{conflicts.map((c) => t(`issue.${c.key}`, c.params)).join(' · ')}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-display text-lg font-semibold tabular-nums">{eur(p.price, lang)}</div>
                      <div className="text-[10px] text-mute">{t('common.refPrice')}</div>
                    </div>
                    <button onClick={() => toggleCompare(p.id)} title={t('picker.compareAdd')} className={cx('grid size-9 place-items-center rounded-lg border', compare.includes(p.id) ? 'border-indigo-400/50 bg-indigo-400/15 text-indigo-200' : 'border-ink/10 text-mute hover:text-ink')}><GitCompareArrows size={15} /></button>
                    <button onClick={() => setExpanded(exp ? null : p.id)} className="grid size-9 place-items-center rounded-lg border border-ink/10 text-mute hover:text-ink" aria-label={t('common.details')}><ChevronDown size={16} className={cx('transition', exp && 'rotate-180')} /></button>
                    <Button variant={inBuild ? 'soft' : 'primary'} size="sm" onClick={() => { addPart(p); openPicker(null) }}>{inBuild ? <Check size={14} /> : null}{t('picker.select')}</Button>
                  </div>
                </div>
                {exp && <div className="border-t border-line p-3"><PriceLinks part={p} /></div>}
              </li>
            )
          })}
        </ul>
      </div>
      <aside className="border-t border-line bg-panel2/40 p-5 lg:border-t-0 lg:border-l">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-teal-200"><ListChecks size={15} />{t('detail.specs')}</div>
        <PartGuide cat={cat} sections="specs" />
      </aside>
    </div>
  )
}

