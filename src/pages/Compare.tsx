import { Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PriceLinks } from '../components/PriceLinks'
import { CatBadge } from '../components/icons'
import { Button, Card, SectionTitle, cx } from '../components/ui'
import { displayName, getPart, partsOf } from '../data/parts'
import { CATEGORIES, type Category, type Part } from '../data/types'
import { useT } from '../i18n'
import { eur } from '../lib/format'
import { perfValue, specRows } from '../lib/specs'
import { useBuild } from '../store/build'
import { CompareTabs } from './Versus'

export default function Compare() {
  const { t, lang } = useT()
  const { compare, setCompare, addPart } = useBuild()
  const initial = compare.map((id) => getPart(id)).filter((p): p is Part => !!p)
  const [cat, setCat] = useState<Category>(initial[0]?.category ?? 'gpu')
  const ids = compare.filter((id) => getPart(id)?.category === cat)
  const parts = ids.map((id) => getPart(id)!).filter(Boolean)
  const options = partsOf(cat).filter((p) => !ids.includes(p.id))
  const rows = useMemo(() => {
    if (!parts.length) return []
    const specLists = parts.map((p) => specRows(p))
    return specLists[0].map((row, i) => {
      const cells = specLists.map((l) => l[i])
      let bestIdx = -1
      if (row.better && cells.every((c) => c?.n !== undefined)) {
        const vals = cells.map((c) => c.n!)
        const target = row.better === 'high' ? Math.max(...vals) : Math.min(...vals)
        if (new Set(vals).size > 1) bestIdx = vals.indexOf(target)
      }
      return { k: row.k, cells, bestIdx }
    })
  }, [parts])
  const priceBest = parts.length > 1 ? parts.reduce((b, p, i) => (p.price < parts[b].price ? i : b), 0) : -1
  const values = parts.map((p) => (perfValue(p) / p.price) * 100)
  const valueBest = parts.length > 1 ? values.indexOf(Math.max(...values)) : -1
  const setIds = (next: string[]) => setCompare([...compare.filter((id) => getPart(id)?.category !== cat), ...next].slice(-8))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.compare')} title={t('compare.title')} sub={t('compare.subtitle')} />
      <CompareTabs />
      <div className="mb-6 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cx('flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm', cat === c ? 'border-accent/50 bg-accent/10 text-teal-100' : 'border-line text-mute hover:text-ink')}>
            <CatBadge cat={c} size={22} />{t(`cat.${c}`)}
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select value="" onChange={(e) => e.target.value && setIds([...ids, e.target.value].slice(-4))} className="h-10 min-w-[260px] rounded-xl border border-ink/10 bg-panel2 px-3 text-sm" disabled={ids.length >= 4}>
          <option value="">+ {t('compare.add')}</option>
          {options.map((p) => <option key={p.id} value={p.id}>{displayName(p)} – {eur(p.price, lang)}</option>)}
        </select>
      </div>
      {!parts.length ? (
        <Card className="p-10 text-center text-mute">{t('compare.empty')}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="w-44 p-4 text-left text-xs font-semibold uppercase tracking-wider text-mute">{t(`cat.${cat}`)}</th>
                {parts.map((p) => (
                  <th key={p.id} className="p-4 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-display font-semibold">{displayName(p)}</div>
                      <button onClick={() => setIds(ids.filter((x) => x !== p.id))} className="rounded p-1 text-mute hover:bg-ink/10" aria-label={t('common.remove')}><X size={14} /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60 bg-ink/[0.02]">
                <td className="p-3 pl-4 text-mute">{t('common.refPrice')}</td>
                {parts.map((p, i) => <td key={p.id} className={cx('p-3 font-display text-lg font-bold tabular-nums', i === priceBest && 'text-emerald-300')}>{eur(p.price, lang)}</td>)}
              </tr>
              <tr className="border-b border-line/60">
                <td className="p-3 pl-4 text-mute">{t('compare.perEuro')}</td>
                {values.map((v, i) => <td key={i} className={cx('p-3 font-semibold tabular-nums', i === valueBest && 'text-emerald-300')}>{v.toFixed(1)}{i === valueBest && <span className="ml-1.5 rounded bg-emerald-400/15 px-1.5 text-[10px]">{t('compare.best')}</span>}</td>)}
              </tr>
              {rows.map((row) => (
                <tr key={row.k} className="border-b border-line/60">
                  <td className="p-3 pl-4 text-mute">{t(`spec.${row.k}`)}</td>
                  {row.cells.map((c, i) => <td key={i} className={cx('p-3', i === row.bestIdx ? 'font-semibold text-emerald-300' : 'text-ink')}>{c?.v}</td>)}
                </tr>
              ))}
              <tr>
                <td className="p-3 pl-4 align-top text-mute">{t('common.whereToBuy')}</td>
                {parts.map((p) => (
                  <td key={p.id} className="p-3 align-top">
                    <PriceLinks part={p} compact />
                    <Button size="sm" variant="primary" className="mt-3" onClick={() => addPart(p)}><Plus size={14} />{t('common.add')}</Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
