import { Box as BoxIcon, Camera, Eye, Layers, Library, Plus, RotateCcw, Rotate3d, Save, ScanEye, Share2, Tag, Trash2, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FpsPanel, IssuesList, SlotList, SpecTable, StatusBadge } from '../components/builder/panels'
import { CatBadge } from '../components/icons'
import { PartGuide } from '../components/PartGuide'
import { PriceLinks } from '../components/PriceLinks'
import { captureRef, Scene, type ViewName } from '../components/three/Scene'
import { Button, Modal, Segmented, Toggle, cx } from '../components/ui'
import { displayName, PRICE_DATE } from '../data/parts'
import { CATEGORIES, type Category, type Part } from '../data/types'
import { useT } from '../i18n'
import { resolve, totalPrice } from '../lib/build'
import { checkBuild } from '../lib/compat'
import { eur } from '../lib/format'
import { estimatePower } from '../lib/power'
import { decodeBuild, shareUrl, toMarkdown } from '../lib/share'
import { useBuild } from '../store/build'
import { useSettings, type RgbMode } from '../store/settings'

const SWATCHES = ['#38e8c6', '#7c8cff', '#ff3d7f', '#ff8a00', '#ffe600', '#00b7ff', '#ffffff', '#a855f7']

type Tab = 'parts' | 'guide' | 'checks' | 'fps'

export default function Builder() {
  const { t, lang } = useT()
  const { build, load, focus, setFocus, openPicker, clear } = useBuild()
  const settings = useSettings()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<{ name: ViewName; n: number }>({ name: 'iso', n: 0 })
  const [tab, setTab] = useState<Tab>(() => (window.innerWidth < 1024 ? 'parts' : 'guide'))
  const [share, setShare] = useState(false)
  const [armed, setArmed] = useState(false)
  const r = useMemo(() => resolve(build), [build])
  const compat = useMemo(() => checkBuild(r), [r])
  const power = useMemo(() => estimatePower(r), [r])
  const total = totalPrice(r)

  useEffect(() => {
    const b = decodeBuild(params.toString())
    if (b) {
      load(b)
      setParams({}, { replace: true })
    }
  }, [params, load, setParams])

  useEffect(() => {
    if (focus) setTab((cur) => (cur === 'parts' || cur === 'guide' ? 'guide' : cur))
  }, [focus])

  const screenshot = () => {
    const url = captureRef.current?.()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'rigforge-build.png'
    a.click()
  }

  const tabs: { id: Tab; label: string; mobileOnly?: boolean; badge?: number }[] = [
    { id: 'parts', label: t('builder.tabParts'), mobileOnly: true },
    { id: 'guide', label: t('builder.tabGuide') },
    { id: 'checks', label: t('builder.tabChecks'), badge: compat.errors + compat.warnings },
    { id: 'fps', label: t('builder.tabPerf') },
  ]

  return (
    <div className="lg:grid lg:h-[calc(100vh-4rem)] lg:grid-cols-[300px_1fr_380px] xl:grid-cols-[330px_1fr_410px]">
      {/* ------------------------------------------------ left: slots */}
      <aside className="hidden min-h-0 flex-col border-r border-line bg-panel/60 lg:flex">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="font-display text-base font-semibold">{t('builder.slots')}</h2>
          <StatusBadge compat={compat} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3"><SlotList r={r} compat={compat} /></div>
        <div className="flex gap-2 border-t border-line p-3">
          <Link to="/builds" className="flex-1"><Button size="sm" className="w-full"><Library size={14} />{t('builder.loadPreset')}</Button></Link>
          <Button size="sm" variant="danger" title={armed ? t('common.confirmClear') : t('common.clear')} onClick={() => { if (armed) { clear(); setArmed(false) } else { setArmed(true); setTimeout(() => setArmed(false), 3000) } }} aria-label={t('common.clear')}><Trash2 size={14} />{armed && <span>{t('common.clear')}?</span>}</Button>
        </div>
      </aside>

      {/* ------------------------------------------------ center: 3D viewer */}
      <section className="viewer-bg relative h-[64vh] min-h-[420px] overflow-hidden lg:h-auto">
        <Scene r={r} view={view} />
        {/* top overlay: views + display toggles */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex items-center gap-1.5">
            <Segmented<ViewName> size="sm" value={view.name} onChange={(v) => setView({ name: v, n: view.n + 1 })} options={[{ id: 'iso', label: t('builder.viewIso') }, { id: 'side', label: t('builder.viewSide') }, { id: 'front', label: t('builder.viewFront') }, { id: 'top', label: t('builder.viewTop') }]} />
            <button onClick={() => setView({ name: view.name, n: view.n + 1 })} title={t('common.reset')} aria-label={t('common.reset')} className="glass grid size-8 place-items-center rounded-lg border border-ink/10 text-mute hover:text-ink"><RotateCcw size={14} /></button>
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
            <Toggle compact on={settings.labels} onChange={(v) => settings.set({ labels: v })} label={t('builder.labels')} icon={<Tag size={13} />} />
            <Toggle compact on={settings.glass} onChange={(v) => settings.set({ glass: v })} label={t('builder.glass')} icon={<Eye size={13} />} />
            <Toggle compact on={settings.xray} onChange={(v) => settings.set({ xray: v })} label={t('builder.xray')} icon={<ScanEye size={13} />} />
            <Toggle compact on={settings.autoRotate} onChange={(v) => settings.set({ autoRotate: v })} label={t('builder.rotate')} icon={<Rotate3d size={13} />} />
            <button onClick={screenshot} title={t('builder.screenshot')} aria-label={t('builder.screenshot')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/[0.04] px-2.5 text-xs font-medium text-mute hover:text-ink"><Camera size={13} /><span className="hidden sm:inline">{t('builder.screenshot')}</span></button>
          </div>
        </div>
        {/* empty-state helper */}
        {!r.case && !r.cpu && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
            <div className="glass pointer-events-auto max-w-sm rounded-2xl border border-ink/10 p-5 text-center">
              <BoxIcon className="mx-auto mb-2 text-accent" />
              <p className="mb-4 text-sm text-ink2">{t('builder.emptyCase')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" size="sm" onClick={() => openPicker('case')}><Plus size={14} />{t('cat.case')}</Button>
                <Button size="sm" onClick={() => openPicker('cpu')}><Plus size={14} />{t('cat.cpu')}</Button>
                <Link to="/builds"><Button size="sm"><Library size={14} />{t('builder.loadPreset')}</Button></Link>
              </div>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-2">
        <div className="glass pointer-events-auto flex max-w-full items-center gap-x-4 gap-y-2 self-start overflow-x-auto rounded-2xl border border-ink/10 px-3 py-2 text-xs whitespace-nowrap">
          <label className="flex items-center gap-2"><Layers size={14} className="text-accent" /><span className="text-mute">{t('builder.explode')}</span>
            <input type="range" min={0} max={1} step={0.01} value={settings.explode} onChange={(e) => settings.set({ explode: Number(e.target.value) })} className="w-24" /></label>
          <label className="hidden items-center gap-2 sm:flex"><span className="text-mute">{t('builder.fanSpeed')}</span>
            <input type="range" min={0} max={1} step={0.01} value={settings.fanSpeed} onChange={(e) => settings.set({ fanSpeed: Number(e.target.value) })} className="w-20" /></label>
          <div className="flex items-center gap-2">
            <span className="text-mute">{t('builder.rgb')}</span>
            <select value={settings.rgbMode} onChange={(e) => settings.set({ rgbMode: e.target.value as RgbMode })} className="h-7 rounded-md border border-ink/10 bg-panel2 px-1.5 text-xs" aria-label={t('builder.rgb')}>
              <option value="rainbow">{t('builder.rgbRainbow')}</option>
              <option value="static">{t('builder.rgbStatic')}</option>
              <option value="breathe">{t('builder.rgbBreathe')}</option>
              <option value="off">{t('builder.rgbOff')}</option>
            </select>
            {settings.rgbMode !== 'rainbow' && settings.rgbMode !== 'off' && (
              <div className="flex items-center gap-1">
                {SWATCHES.map((c) => (
                  <button key={c} onClick={() => settings.set({ rgbColor: c })} className={cx('size-4 rounded-full border', settings.rgbColor === c ? 'border-ink ring-2 ring-ink/40' : 'border-ink/20')} style={{ background: c }} aria-label={c} />
                ))}
                <input type="color" value={settings.rgbColor} onChange={(e) => settings.set({ rgbColor: e.target.value })} className="size-5 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="custom color" />
              </div>
            )}
          </div>
        </div>
        {/* summary bar */}
        <div className="glass pointer-events-auto flex items-center gap-x-5 gap-y-2 rounded-2xl border border-ink/10 px-4 py-2.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-mute">{t('common.total')}</div>
            <div className="font-display text-xl font-bold tabular-nums">{eur(total, lang)}</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-mute">{t('builder.power')}</div>
            <div className="flex items-center gap-1 text-sm font-semibold tabular-nums"><Zap size={13} className="text-amber-300" />{power.total ? `${Math.round(power.total)} W` : '—'}</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-mute">{t('builder.psuRec')}</div>
            <div className="text-sm font-semibold tabular-nums">{power.total ? `${power.recommended} W` : '—'}</div>
          </div>
          <button onClick={() => setTab('checks')} className="min-w-0 lg:hidden"><StatusBadge compat={compat} /></button>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => setShare(true)}><Share2 size={14} />{t('common.share')}</Button>
          </div>
        </div>
        </div>
      </section>

      {/* ------------------------------------------------ right: tabs */}
      <aside className="flex min-h-0 flex-col border-l border-line bg-panel/60">
        <div className="flex gap-1 border-b border-line px-3 pt-3">
          {tabs.map((x) => (
            <button key={x.id} onClick={() => setTab(x.id)} className={cx('relative rounded-t-lg px-3 py-2 text-sm font-medium transition', x.mobileOnly && 'lg:hidden', tab === x.id ? 'bg-ink/[0.06] text-ink' : 'text-mute hover:text-ink')}>
              {x.label}
              {!!x.badge && <span className={cx('ml-1.5 rounded-full px-1.5 text-[10px]', compat.errors ? 'bg-rose-500/25 text-rose-200' : 'bg-amber-400/20 text-amber-200')}>{x.badge}</span>}
              {tab === x.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-accent" />}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'parts' && <SlotList r={r} compat={compat} />}
          {tab === 'guide' && <GuideTab focus={focus} r={r} setFocus={setFocus} openPicker={openPicker} />}
          {tab === 'checks' && (
            <div className="space-y-4">
              <StatusBadge compat={compat} />
              <IssuesList compat={compat} />
              <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-sm">
                <div className="mb-2 flex items-center gap-1.5 font-semibold"><Zap size={15} className="text-amber-300" />{t('builder.power')}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-xs text-mute">CPU</div><div className="font-semibold tabular-nums">{power.cpu} W</div></div>
                  <div><div className="text-xs text-mute">GPU</div><div className="font-semibold tabular-nums">{power.gpu} W</div></div>
                  <div><div className="text-xs text-mute">+</div><div className="font-semibold tabular-nums">{Math.round(power.other)} W</div></div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                  {r.psu && <div className={cx('h-full rounded-full', power.total > r.psu.wattage ? 'bg-rose-500' : power.recommended > r.psu.wattage ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: `${Math.min(100, (power.total / r.psu.wattage) * 100)}%` }} />}
                </div>
                <div className="mt-1 text-xs text-mute">{r.psu ? `${Math.round(power.total)} / ${r.psu.wattage} W` : `${t('common.recommended')}: ${power.recommended} W`}</div>
              </div>
            </div>
          )}
          {tab === 'fps' && <FpsPanel r={r} />}
        </div>
      </aside>

      <ShareModal open={share} onClose={() => setShare(false)} />
    </div>
  )
}

function GuideTab({ focus, r, setFocus, openPicker }: { focus: Category | null; r: ReturnType<typeof resolve>; setFocus: (c: Category | null) => void; openPicker: (c: Category) => void }) {
  const { t, lang } = useT()
  if (!focus)
    return (
      <div className="space-y-3">
        <p className="text-sm text-mute">{t('builder.clickHint')}</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFocus(c)} className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-panel2/60 p-3 text-xs text-ink2 hover:border-accent/40">
              <CatBadge cat={c} size={34} />
              <span className="text-center leading-tight">{t(`cat.${c}`)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  const parts: Part[] = focus === 'storage' ? r.storage : r[focus] ? [r[focus] as Part] : []
  return (
    <div className="space-y-5">
      {parts.map((p) => (
        <div key={p.id} className="space-y-3 rounded-2xl border border-accent/25 bg-accent/[0.04] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">{t('detail.thisPart')}</div>
          <div className="flex items-start justify-between gap-3">
            <div className="font-display text-base font-semibold leading-snug">{displayName(p)}</div>
            <div className="text-right"><div className="font-display text-lg font-bold tabular-nums">{eur(p.price, lang)}</div><div className="text-[10px] text-mute">{t('common.refPrice')} · {PRICE_DATE}</div></div>
          </div>
          <SpecTable part={p} />
          <PriceLinks part={p} compact />
        </div>
      ))}
      <Button variant={parts.length ? 'soft' : 'primary'} className="w-full" onClick={() => openPicker(focus)}>
        <Plus size={15} />{parts.length ? t('detail.allOptions') : t('builder.addPart', { cat: t(`cat.${focus}`) })}
      </Button>
      <PartGuide cat={focus} dense />
    </div>
  )
}

function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const { build, saveAs } = useBuild()
  const [copied, setCopied] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const url = shareUrl(build)
  const md = toMarkdown(resolve(build), lang, url, (c) => t(`cat.${c}`), t('common.priceNote', { date: PRICE_DATE }))
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard may be blocked – the text stays selectable */
    }
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }
  return (
    <Modal open={open} onClose={onClose} title={t('builder.shareTitle')}>
      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-sm text-mute">{t('builder.shareText')}</p>
          <div className="flex gap-2">
            <input readOnly value={url} onFocus={(e) => e.target.select()} className="h-10 min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/[0.04] px-3 text-xs" />
            <Button variant="primary" onClick={() => copy(url, 'url')}>{copied === 'url' ? t('common.copied') : t('common.copy')}</Button>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">{t('builder.markdown')}</span><Button size="sm" onClick={() => copy(md, 'md')}>{copied === 'md' ? t('common.copied') : t('common.copy')}</Button></div>
          <textarea readOnly value={md} rows={8} className="w-full rounded-xl border border-ink/10 bg-ink/[0.04] p-3 font-mono text-[11px] text-ink2" />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">{t('builder.saveAs')}</div>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My 1440p build" className="h-10 min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/[0.04] px-3 text-sm" />
            <Button onClick={() => { saveAs(name || 'Build ' + new Date().toLocaleDateString()); setSaved(true); setTimeout(() => setSaved(false), 1500) }}><Save size={14} />{saved ? t('builder.saved') : t('common.save')}</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
