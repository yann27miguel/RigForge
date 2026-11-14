import { Check, Globe, Scale, Table2, Trophy } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ImportPC } from '../components/ImportPC'
import { CatBadge } from '../components/icons'
import { Button, Card, Modal, SectionTitle, Segmented, Toggle, cx } from '../components/ui'
import { GAMES, type Resolution } from '../data/games'
import { displayName } from '../data/parts'
import { PRESETS } from '../data/presets'
import { CATEGORIES, type Build, type Category, type Part } from '../data/types'
import { useT } from '../i18n'
import { resolve } from '../lib/build'
import { eur, num } from '../lib/format'
import { perfValue } from '../lib/specs'
import { energyCost, metrics, type Metrics } from '../lib/versus'
import { useBuild, type SavedBuild } from '../store/build'
import { useSettings } from '../store/settings'

interface Pick {
  key: string
  label: string
  build: Build
  price?: number
}

const A = 'var(--series-a)'
const B = 'var(--series-b)'

export function CompareTabs() {
  const { t } = useT()
  const tab = (isActive: boolean) => cx('rounded-lg px-3.5 py-1.5 text-sm font-medium transition', isActive ? 'bg-accent text-onaccent' : 'text-mute hover:text-ink')
  return (
    <div className="mb-6 inline-flex rounded-xl border border-ink/10 bg-ink/[0.04] p-1">
      <NavLink to="/versus" className={({ isActive }) => tab(isActive)}>{t('versus.tabPcs')}</NavLink>
      <NavLink to="/compare" className={({ isActive }) => tab(isActive)}>{t('versus.tabParts')}</NavLink>
    </div>
  )
}

function SeriesKey({ s, label }: { s: 'a' | 'b'; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: s === 'a' ? A : B }} />{label}</span>
}

function useSources() {
  const { t, lang } = useT()
  const { build, saved } = useBuild()
  return useMemo(() => {
    const list: Pick[] = [{ key: 'current', label: t('versus.current'), build }]
    for (const s of saved) list.push({ key: 'saved:' + s.id, label: (s.source ? '🌐 ' : '💾 ') + s.name, build: s.build, price: s.price })
    for (const p of PRESETS) list.push({ key: 'preset:' + p.id, label: '★ ' + p.name[lang], build: p.build })
    return list
  }, [build, saved, t, lang])
}

function SlotPicker({ which, pick, setPick, sources, onImport }: { which: 'a' | 'b'; pick: Pick; setPick: (p: Pick) => void; sources: Pick[]; onImport: () => void }) {
  const { t } = useT()
  const opts = sources.some((s) => s.key === pick.key) ? sources : [pick, ...sources]
  return (
    <Card className="p-4" >
      <div className="mb-2 flex items-center justify-between text-sm font-semibold"><SeriesKey s={which} label={t(which === 'a' ? 'versus.pcA' : 'versus.pcB')} /></div>
      <div className="flex gap-2">
        <select value={pick.key} onChange={(e) => setPick(opts.find((s) => s.key === e.target.value)!)} className="h-10 min-w-0 flex-1 rounded-xl border border-ink/10 bg-panel2 px-3 text-sm" aria-label={t(which === 'a' ? 'versus.pcA' : 'versus.pcB')}>
          {opts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <Button onClick={onImport} title={t('versus.import')}><Globe size={15} /><span className="hidden sm:inline">{t('versus.import')}</span></Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------ tooltip */
function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; content: ReactNode } | null>(null)
  const el = tip && (
    <div className="pointer-events-none absolute z-20 min-w-[150px] rounded-xl border border-ink/15 bg-panel px-3 py-2 text-xs shadow-xl" style={{ left: tip.x + 12, top: tip.y + 12 }}>{tip.content}</div>
  )
  const bind = (content: ReactNode) => ({
    onMouseMove: (e: React.MouseEvent) => {
      const box = (e.currentTarget as Element).closest('[data-chart]')!.getBoundingClientRect()
      setTip({ x: e.clientX - box.left, y: e.clientY - box.top, content })
    },
    onMouseLeave: () => setTip(null),
  })
  return { el, bind }
}

function TipRows({ title, a, b, fmt }: { title: string; a: number; b: number; fmt: (n: number) => string }) {
  const { t } = useT()
  return (
    <>
      <div className="mb-1 font-semibold text-ink">{title}</div>
      <div className="flex justify-between gap-4 text-ink2"><SeriesKey s="a" label={t('versus.pcA')} /><b className="tabular-nums text-ink">{fmt(a)}</b></div>
      <div className="flex justify-between gap-4 text-ink2"><SeriesKey s="b" label={t('versus.pcB')} /><b className="tabular-nums text-ink">{fmt(b)}</b></div>
    </>
  )
}

/* ------------------------------------------------------------ KPI tile */
function Kpi({ label, a, b, fmt, better }: { label: string; a: number; b: number; fmt: (n: number) => string; better: 'high' | 'low' }) {
  const { t } = useT()
  const diff = Math.min(a, b) > 0 ? Math.round((Math.abs(a - b) / Math.min(a, b)) * 100) : null
  const win = a === b || diff === 0 ? null : (better === 'high' ? a > b : a < b) ? 'a' : 'b'
  return (
    <Card className="p-4">
      <div className="mb-2 text-xs font-medium text-mute">{label}</div>
      {(['a', 'b'] as const).map((s) => (
        <div key={s} className="flex items-center justify-between gap-2">
          <SeriesKey s={s} label={s.toUpperCase()} />
          <span className="flex items-center gap-1.5 font-display text-lg font-bold tabular-nums">{fmt(s === 'a' ? a : b)}{win === s && <Check size={15} className="text-emerald-300" aria-label={t('versus.better')} />}</span>
        </div>
      ))}
      {win && diff !== null && <div className="mt-1.5 text-[11px] text-mute">{t('versus.winsBy', { pc: win.toUpperCase(), n: diff })}</div>}
    </Card>
  )
}

/* ------------------------------------------------------------ radar */
function Radar({ a, b }: { a: Metrics['radar']; b: Metrics['radar'] }) {
  const { t } = useT()
  const { el, bind } = useTip()
  const keys = Object.keys(a) as (keyof Metrics['radar'])[]
  const S = 320
  const c = S / 2
  const R = 110
  const pt = (i: number, v: number) => {
    const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2
    return [c + Math.cos(ang) * (R * v) / 100, c + Math.sin(ang) * (R * v) / 100] as const
  }
  const poly = (m: Metrics['radar']) => keys.map((k, i) => pt(i, Math.max(2, m[k])).join(',')).join(' ')
  return (
    <div data-chart className="relative">
      <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto w-full max-w-[380px]" role="img" aria-label={t('versus.radar')}>
        {[25, 50, 75, 100].map((r) => <polygon key={r} points={keys.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" stroke="currentColor" className="text-line" strokeWidth={1} />)}
        {keys.map((k, i) => {
          const [x, y] = pt(i, 100)
          const [lx, ly] = pt(i, 122)
          return (
            <g key={k}>
              <line x1={c} y1={c} x2={x} y2={y} stroke="currentColor" className="text-line" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--c-mute)] text-[10.5px]">{t(`versus.ax.${k}`)}</text>
            </g>
          )
        })}
        <polygon points={poly(a)} fill={A} fillOpacity={0.14} stroke={A} strokeWidth={2} strokeLinejoin="round" />
        <polygon points={poly(b)} fill={B} fillOpacity={0.14} stroke={B} strokeWidth={2} strokeLinejoin="round" />
        {keys.map((k, i) => (
          <g key={k} {...bind(<TipRows title={t(`versus.ax.${k}`)} a={a[k]} b={b[k]} fmt={(n) => String(Math.round(n))} />)}>
            <circle cx={pt(i, Math.max(2, a[k]))[0]} cy={pt(i, Math.max(2, a[k]))[1]} r={4.5} fill={A} stroke="var(--c-panel)" strokeWidth={2} />
            <circle cx={pt(i, Math.max(2, b[k]))[0]} cy={pt(i, Math.max(2, b[k]))[1]} r={4.5} fill={B} stroke="var(--c-panel)" strokeWidth={2} />
            <circle cx={pt(i, Math.max(a[k], b[k]))[0]} cy={pt(i, Math.max(a[k], b[k]))[1]} r={16} fill="transparent" />
          </g>
        ))}
      </svg>
      {el}
    </div>
  )
}

/* ------------------------------------------------------------ grouped horizontal bars */
function Grouped({ rows, fmt, max }: { rows: { label: ReactNode; title: string; a: number; b: number }[]; fmt: (n: number) => string; max?: number }) {
  const { el, bind } = useTip()
  const top = max ?? Math.max(1, ...rows.flatMap((r) => [r.a, r.b]))
  return (
    <div data-chart className="relative">
      <ul className="space-y-3">
        {rows.map((r) => {
          const delta = Math.min(r.a, r.b) > 0 ? Math.round(((r.b - r.a) / r.a) * 100) : null
          return (
            <li key={r.title} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-sm" {...bind(<TipRows title={r.title} a={r.a} b={r.b} fmt={fmt} />)}>
              <div className="truncate text-ink2">{r.label}</div>
              <div className="space-y-[2px] py-1">
                <div className="h-2.5 rounded-r-[4px]" style={{ width: `${(r.a / top) * 100}%`, minWidth: r.a ? 3 : 0, background: A }} />
                <div className="h-2.5 rounded-r-[4px]" style={{ width: `${(r.b / top) * 100}%`, minWidth: r.b ? 3 : 0, background: B }} />
              </div>
              <div className="w-14 text-right text-xs tabular-nums text-mute">{delta === null ? '' : `${delta > 0 ? '+' : ''}${delta}%`}</div>
            </li>
          )
        })}
      </ul>
      {el}
    </div>
  )
}

export default function Versus() {
  const { t, lang } = useT()
  const sources = useSources()
  const { res, upscaling, set } = useSettings()
  const current = useBuild((s) => s.build)
  const hasCurrent = !!(current.cpu || current.gpu)
  const [pa, setPa] = useState<Pick>(() => (hasCurrent ? sources[0] : sources.find((s) => s.key === 'preset:sweet-1440')!))
  const [pb, setPb] = useState<Pick>(() => sources.find((s) => s.key === 'preset:enthusiast-4k')!)
  const [importFor, setImportFor] = useState<'a' | 'b' | null>(null)
  const [hours, setHours] = useState(3)
  const [tariff, setTariff] = useState(0.35)
  const [asTable, setAsTable] = useState(false)
  const ra = useMemo(() => resolve(pa.build), [pa])
  const rb = useMemo(() => resolve(pb.build), [pb])
  const ma = useMemo(() => metrics(ra, res, upscaling, pa.price), [ra, res, upscaling, pa.price])
  const mb = useMemo(() => metrics(rb, res, upscaling, pb.price), [rb, res, upscaling, pb.price])
  const ea = energyCost(ma.gamingDraw, hours, tariff)
  const eb = energyCost(mb.gamingDraw, hours, tariff)
  const fpsRows = GAMES.filter((g) => ma.fpsByGame[g.id] !== undefined || mb.fpsByGame[g.id] !== undefined).map((g) => ({ label: g.name, title: g.name, a: ma.fpsByGame[g.id] ?? 0, b: mb.fpsByGame[g.id] ?? 0 }))
  const priceRows = CATEGORIES.filter((c) => ma.priceByCat[c] || mb.priceByCat[c]).map((c) => ({ label: <span className="flex items-center gap-2"><CatBadge cat={c} size={20} />{t(`cat.${c}`)}</span>, title: t(`cat.${c}`), a: ma.priceByCat[c], b: mb.priceByCat[c] }))
  const partOf = (r: ReturnType<typeof resolve>, c: Category): Part[] => (c === 'storage' ? r.storage : r[c] ? [r[c] as Part] : [])

  const fpsDiff = ma.avgFps && mb.avgFps ? Math.round(((mb.avgFps - ma.avgFps) / ma.avgFps) * 100) : 0
  const priceDiff = ma.price && mb.price ? Math.round(((mb.price - ma.price) / ma.price) * 100) : 0
  const verdict = !ma.avgFps || !mb.avgFps ? t('versus.vIncomplete')
    : Math.abs(fpsDiff) < 4 ? t('versus.vSame', { cheaper: ma.price <= mb.price ? 'A' : 'B', n: Math.abs(priceDiff) })
    : t('versus.vFaster', { faster: fpsDiff > 0 ? 'B' : 'A', fps: Math.abs(fpsDiff), more: (fpsDiff > 0) === (priceDiff > 0) ? t('versus.more') : t('versus.less'), price: Math.abs(priceDiff) })

  const use = (b: SavedBuild) => {
    const p: Pick = { key: 'temp:' + b.id, label: '🌐 ' + b.name, build: b.build, price: b.price }
    if (importFor === 'a') setPa(p)
    else setPb(p)
    setImportFor(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.compare')} title={t('versus.title')} sub={t('versus.subtitle')} />
      <CompareTabs />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <SlotPicker which="a" pick={pa} setPick={setPa} sources={sources} onImport={() => setImportFor('a')} />
        <SlotPicker which="b" pick={pb} setPick={setPb} sources={sources} onImport={() => setImportFor('b')} />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented<Resolution> size="sm" value={res} onChange={(v) => set({ res: v })} options={[{ id: '1080p', label: '1080p' }, { id: '1440p', label: '1440p' }, { id: '4k', label: '4K' }]} />
        <Toggle on={upscaling} onChange={(v) => set({ upscaling: v })} label="DLSS / FSR" />
        <label className="flex items-center gap-2 text-xs text-mute">{t('versus.hours')}<input type="number" min={0} max={24} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-8 w-16 rounded-lg border border-ink/10 bg-ink/[0.04] px-2 text-sm text-ink" /></label>
        <label className="flex items-center gap-2 text-xs text-mute">{t('versus.tariff')}<input type="number" min={0} max={2} step={0.01} value={tariff} onChange={(e) => setTariff(Number(e.target.value))} className="h-8 w-20 rounded-lg border border-ink/10 bg-ink/[0.04] px-2 text-sm text-ink" /></label>
      </div>

      <Card className="surface-metal mb-6 flex items-start gap-3 p-5">
        <Trophy className="mt-0.5 shrink-0 text-accent" size={20} />
        <p className="text-base leading-relaxed text-ink">{verdict}</p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={t('common.price')} a={ma.price} b={mb.price} fmt={(n) => eur(n, lang)} better="low" />
        <Kpi label={t('versus.avgFps', { res })} a={ma.avgFps} b={mb.avgFps} fmt={(n) => num(n, lang)} better="high" />
        <Kpi label={t('versus.draw')} a={ma.gamingDraw} b={mb.gamingDraw} fmt={(n) => `${num(n, lang)} W`} better="low" />
        <Kpi label={t('versus.energy')} a={ea} b={eb} fmt={(n) => eur(n, lang)} better="low" />
        <Kpi label={t('versus.ppe')} a={ma.perfPerEuro} b={mb.perfPerEuro} fmt={(n) => num(n, lang, 1)} better="high" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card className="p-5">
          <div className="mb-1 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{t('versus.radar')}</h2><div className="flex gap-3 text-xs text-ink2"><SeriesKey s="a" label="A" /><SeriesKey s="b" label="B" /></div></div>
          <p className="mb-2 text-xs text-mute">{t('versus.radarNote')}</p>
          <Radar a={ma.radar} b={mb.radar} />
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{t('versus.fpsTitle', { res })}</h2>
            <div className="flex items-center gap-3 text-xs text-ink2"><SeriesKey s="a" label={pa.label.replace(/^[^\w]+/u, '').slice(0, 22)} /><SeriesKey s="b" label={pb.label.replace(/^[^\w]+/u, '').slice(0, 22)} />
              <button onClick={() => setAsTable(!asTable)} className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2 py-1 text-mute hover:text-ink"><Table2 size={13} />{t(asTable ? 'versus.asChart' : 'versus.asTable')}</button></div>
          </div>
          {fpsRows.length === 0 ? <p className="text-sm text-mute">{t('perf.noBuild')}</p> : asTable ? (
            <table className="w-full text-sm"><thead><tr className="text-left text-xs text-mute"><th className="py-1">{t('perf.game')}</th><th className="text-right">A</th><th className="text-right">B</th></tr></thead>
              <tbody>{fpsRows.map((r) => <tr key={r.title} className="border-t border-line/60"><td className="py-1.5">{r.title}</td><td className="text-right tabular-nums">{r.a}</td><td className="text-right tabular-nums">{r.b}</td></tr>)}</tbody></table>
          ) : <Grouped rows={fpsRows} fmt={(n) => `${n} FPS`} />}
          <p className="mt-3 text-[11px] text-mute">{t('versus.deltaNote')}</p>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">{t('versus.priceTitle')}</h2>
          <Grouped rows={priceRows} fmt={(n) => eur(n, lang)} />
          {(pa.price || pb.price) && <p className="mt-3 text-[11px] text-mute">{t('versus.listedNote')}</p>}
        </Card>
        <Card className="overflow-x-auto p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Scale size={18} />{t('versus.partsTitle')}</h2>
          <table className="w-full min-w-[460px] text-sm">
            <thead><tr className="text-left text-xs text-mute"><th className="pb-2"></th><th className="pb-2"><SeriesKey s="a" label="A" /></th><th className="pb-2"><SeriesKey s="b" label="B" /></th></tr></thead>
            <tbody>
              {CATEGORIES.map((c) => {
                const x = partOf(ra, c)
                const y = partOf(rb, c)
                if (!x.length && !y.length) return null
                const vx = x.reduce((s, p) => s + perfValue(p), 0)
                const vy = y.reduce((s, p) => s + perfValue(p), 0)
                const generic = [...x, ...y].some((p) => p.brand === 'Generic')
                const win = generic || vx === vy ? null : vx > vy ? 'a' : 'b'
                const cell = (ps: Part[], w: boolean) => <td className={cx('py-2 pr-2 align-top', w && 'font-semibold')}>{ps.length ? ps.map((p) => <div key={p.id} className="truncate" title={displayName(p)}>{displayName(p)}</div>) : <span className="text-mute">—</span>}{w && <span className="text-[10px] font-semibold text-emerald-300"> ✓ {t('versus.better')}</span>}</td>
                return (
                  <tr key={c} className="border-t border-line/60">
                    <td className="py-2 pr-2 align-top"><CatBadge cat={c} size={24} /></td>
                    {cell(x, win === 'a')}
                    {cell(y, win === 'b')}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(ma.errors > 0 || mb.errors > 0) && <p className="mt-3 text-xs text-amber-300">{t('versus.compatWarn')}</p>}
        </Card>
      </div>

      <Modal open={!!importFor} onClose={() => setImportFor(null)} wide title={<span className="flex items-center gap-2"><Globe size={18} className="text-accent" />{t('versus.importTitle')}</span>}>
        {importFor && <ImportPC onUse={use} slotLabel={importFor.toUpperCase()} />}
      </Modal>
    </div>
  )
}
