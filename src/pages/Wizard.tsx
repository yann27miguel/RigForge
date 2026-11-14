import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Bot, Check, Cpu, Film, Gamepad2, Monitor, PackageCheck, Pencil, Radio, RefreshCw, Sparkles, Target, Wifi } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FpsPanel } from '../components/builder/panels'
import { BrandChip, CatBadge } from '../components/icons'
import { OwnedEditor } from '../components/OwnedEditor'
import { Badge, Button, Card, SectionTitle, Segmented, Toggle, cx } from '../components/ui'
import { displayName } from '../data/parts'
import { CAT_COLOR } from '../data/style'
import { CATEGORIES, type Build, type Part } from '../data/types'
import { useT } from '../i18n'
import { partsInBuild, resolve } from '../lib/build'
import { eur } from '../lib/format'
import { recommend, type UseCase, type WizardInput } from '../lib/wizard'
import { useBuild } from '../store/build'

const UC: { id: UseCase; icon: typeof Cpu }[] = [
  { id: 'esports', icon: Target },
  { id: 'gaming1440', icon: Gamepad2 },
  { id: 'gaming4k', icon: Monitor },
  { id: 'streaming', icon: Radio },
  { id: 'creator', icon: Film },
  { id: 'office', icon: Cpu },
  { id: 'ai', icon: Sparkles },
]

const STEPS = ['use', 'budget', 'owned', 'prefs'] as const
type Step = (typeof STEPS)[number]

const hasAny = (b: Build) => !!(b.cpu || b.gpu || b.motherboard || b.ram || b.psu || b.case || b.cooler || b.fans || b.storage.length)

function Bubble({ who, children }: { who: 'bot' | 'me'; children: ReactNode }) {
  return (
    <div className={cx('flex items-start gap-2.5', who === 'me' && 'justify-end')}>
      {who === 'bot' && <div className="mat mat-motherboard size-8 shrink-0 rounded-full"><Bot size={16} /></div>}
      <div className={cx('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed', who === 'bot' ? 'rounded-tl-sm bg-ink/[0.06] text-ink' : 'rounded-tr-sm bg-accent text-onaccent')}>{children}</div>
    </div>
  )
}

export default function Wizard() {
  const { t, lang } = useT()
  const nav = useNavigate()
  const { load, owned } = useBuild()
  const [step, setStep] = useState<Step>('use')
  const [reuse, setReuse] = useState<boolean | null>(() => (hasAny(owned) ? true : null))
  const [input, setInput] = useState<Omit<WizardInput, 'owned'>>({ budget: 1800, useCase: 'gaming1440', platform: 'any', color: 'any', size: 'any', wifi: false, rgb: false })
  const set = (p: Partial<WizardInput>) => setInput((i) => ({ ...i, ...p }))
  const effectiveOwned = reuse ? owned : { storage: [] }
  const result = useMemo(() => recommend({ ...input, owned: effectiveOwned }), [input, effectiveOwned])
  const r = useMemo(() => (result && result.build.cpu ? resolve(result.build) : null), [result])
  const ownedIds = new Set(reuse ? partsInBuild(resolve(owned)).map((p) => p.id) : [])
  const parts = r ? partsInBuild(r) : []
  const newParts = parts.filter((p) => !ownedIds.has(p.id))
  const alloc = CATEGORIES.map((c) => ({ c, color: CAT_COLOR[c], sum: newParts.filter((p) => p.category === c).reduce((s, p) => s + p.price, 0) })).filter((a) => a.sum > 0)
  const idx = STEPS.indexOf(step)
  const go = (d: 1 | -1) => setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, idx + d))])

  const answers: Record<Step, string> = {
    use: t(`wizard.uc.${input.useCase}`),
    budget: eur(input.budget, lang),
    owned: reuse === null ? '' : reuse ? t('wizard.aOwned', { n: partsInBuild(resolve(owned)).length }) : t('wizard.noFresh'),
    prefs: [input.platform !== 'any' && input.platform.toUpperCase(), input.color !== 'any' && t(`wizard.${input.color}`), input.size !== 'any' && t(`wizard.${input.size}`), input.wifi && 'Wi-Fi', input.rgb && 'RGB'].filter(Boolean).join(' · ') || t('wizard.noPrefs'),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.wizard')} title={t('wizard.title')} sub={t('wizard.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="flex flex-col p-5 sm:p-6">
          {/* progress */}
          <ol className="mb-5 flex items-center gap-2" aria-label={t('wizard.progress')}>
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2">
                <button onClick={() => setStep(s)} className={cx('grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition', i < idx ? 'bg-accent/20 text-accent' : i === idx ? 'bg-accent text-onaccent' : 'bg-ink/[0.06] text-mute')} aria-current={i === idx ? 'step' : undefined} aria-label={t(`wizard.q.${s}`)}>
                  {i < idx ? <Check size={14} /> : i + 1}
                </button>
                {i < STEPS.length - 1 && <span className={cx('h-0.5 flex-1 rounded', i < idx ? 'bg-accent/50' : 'bg-ink/10')} />}
              </li>
            ))}
          </ol>

          {/* conversation so far */}
          <div className="mb-4 space-y-2.5">
            {STEPS.slice(0, idx).map((s) => (
              <div key={s} className="space-y-1.5">
                <Bubble who="bot">{t(`wizard.q.${s}`)}</Bubble>
                <div className="flex justify-end"><button onClick={() => setStep(s)} className="group inline-flex items-center gap-1.5 rounded-2xl rounded-tr-sm bg-accent/15 px-3.5 py-2 text-sm text-ink hover:bg-accent/25">{answers[s]}<Pencil size={12} className="opacity-50 group-hover:opacity-100" /></button></div>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
              <Bubble who="bot">{t(`wizard.q.${step}`)}</Bubble>
              {step === 'use' && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {UC.map(({ id, icon: Icon }) => (
                    <button key={id} onClick={() => { set({ useCase: id }); go(1) }} className={cx('rounded-xl border p-3 text-left transition', input.useCase === id ? 'border-accent/60 bg-accent/10' : 'border-line bg-panel2/60 hover:border-ink/20')}>
                      <Icon size={18} className={input.useCase === id ? 'text-accent' : 'text-mute'} />
                      <div className="mt-1.5 text-sm font-semibold">{t(`wizard.uc.${id}`)}</div>
                      <div className="text-[11px] leading-tight text-mute">{t(`wizard.ucd.${id}`)}</div>
                    </button>
                  ))}
                </div>
              )}
              {step === 'budget' && (
                <div>
                  <div className="mb-3 flex items-baseline justify-between"><label htmlFor="budget" className="text-sm text-mute">{t('wizard.budgetNew')}</label><span className="font-display text-3xl font-bold text-accent tabular-nums">{eur(input.budget, lang)}</span></div>
                  <input id="budget" type="range" min={300} max={7500} step={50} value={input.budget} onChange={(e) => set({ budget: Number(e.target.value) })} className="w-full" />
                  <div className="mt-1 flex justify-between text-xs text-mute"><span>300 €</span><span>7.500 €</span></div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{[800, 1200, 1800, 2500, 4000].map((b) => <button key={b} onClick={() => set({ budget: b })} className={cx('rounded-lg border px-2.5 py-1 text-xs', input.budget === b ? 'border-accent/50 bg-accent/10 text-teal-200' : 'border-ink/10 text-mute hover:text-ink')}>{eur(b, lang)}</button>)}</div>
                </div>
              )}
              {step === 'owned' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant={reuse ? 'primary' : 'soft'} onClick={() => setReuse(true)}><PackageCheck size={15} />{t('wizard.yesOwn')}</Button>
                    <Button variant={reuse === false ? 'primary' : 'soft'} onClick={() => { setReuse(false); go(1) }}>{t('wizard.noFresh')}</Button>
                  </div>
                  {reuse && (
                    <>
                      <p className="text-xs text-mute">{t('wizard.ownedHelp')}</p>
                      <OwnedEditor />
                    </>
                  )}
                </div>
              )}
              {step === 'prefs' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><div className="mb-2 text-sm font-semibold">{t('wizard.platform')}</div><Segmented size="sm" value={input.platform} onChange={(v) => set({ platform: v })} options={[{ id: 'any', label: t('wizard.any') }, { id: 'amd', label: 'AMD' }, { id: 'intel', label: 'Intel' }]} /></div>
                  <div><div className="mb-2 text-sm font-semibold">{t('wizard.color')}</div><Segmented size="sm" value={input.color} onChange={(v) => set({ color: v })} options={[{ id: 'any', label: t('wizard.any') }, { id: 'black', label: t('wizard.black') }, { id: 'white', label: t('wizard.white') }]} /></div>
                  <div><div className="mb-2 text-sm font-semibold">{t('wizard.size')}</div><Segmented size="sm" value={input.size} onChange={(v) => set({ size: v })} options={[{ id: 'any', label: t('wizard.sizeAny') }, { id: 'compact', label: t('wizard.compact') }, { id: 'sff', label: t('wizard.sff') }]} /></div>
                  <div><div className="mb-2 text-sm font-semibold">{t('wizard.extras')}</div><div className="flex gap-2"><Toggle on={input.wifi} onChange={(v) => set({ wifi: v })} label={t('wizard.wifi')} icon={<Wifi size={13} />} /><Toggle on={input.rgb} onChange={(v) => set({ rgb: v })} label={t('wizard.rgb')} icon={<Sparkles size={13} />} /></div></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={idx === 0}><ArrowLeft size={14} />{t('common.back')}</Button>
            {idx < STEPS.length - 1 ? <Button size="sm" variant="primary" onClick={() => go(1)}>{t('common.next')}<ArrowRight size={14} /></Button> : <span className="text-xs text-mute">{t('wizard.liveHint')}</span>}
          </div>
        </Card>

        <motion.div key={JSON.stringify(result?.build)} initial={{ opacity: 0.5, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            {!result || !r ? (
              <p className="text-mute">{result?.minBudget ? t('wizard.tooLow', { min: eur(Math.ceil(result.minBudget / 50) * 50, lang) }) : t('wizard.noResult')}</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-accent">{t('wizard.result')}</div>
                    <div className="font-display text-3xl font-bold tabular-nums">{eur(result.total, lang)}</div>
                    <div className="text-xs text-mute">{ownedIds.size ? t('wizard.newSpend') + ' · ' : ''}{t('wizard.left', { n: eur(input.budget - result.total, lang) })}</div>
                  </div>
                  <Button variant="primary" onClick={() => { load(result.build); nav('/builder') }}>{t('wizard.openBuilder')}<ArrowRight size={16} /></Button>
                </div>
                {(result.reused.length > 0 || result.replaced.length > 0) && (
                  <div className="space-y-2 rounded-xl border border-line bg-panel2/50 p-3 text-sm">
                    {result.reused.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="text-mute">{t('wizard.reused')}:</span>{result.reused.map((c) => <Badge key={c} tone="green"><Check size={11} />{t(`cat.${c}`)}</Badge>)}</div>}
                    {result.replaced.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="text-mute">{t('wizard.replaced')}:</span>{result.replaced.map((c) => <Badge key={c} tone="amber"><RefreshCw size={11} />{t(`cat.${c}`)}</Badge>)}<span className="w-full text-xs text-mute">{t('wizard.replacedWhy')}</span></div>}
                  </div>
                )}
                {result.reused.includes('gpu') && input.budget - result.total > 300 && r.gpu && r.gpu.gaming < 50 && input.useCase !== 'office' && (
                  <p className="rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-3 py-2 text-sm text-indigo-200">{t('wizard.gpuHint', { gpu: displayName(r.gpu), n: eur(input.budget - result.total, lang) })}</p>
                )}
                <ul className="space-y-2 rounded-xl border border-line bg-panel2/50 p-3">
                  {parts.map((p: Part, i) => (
                    <li key={p.id + i} className="flex items-center gap-2.5 text-sm">
                      <CatBadge cat={p.category} size={26} />
                      <span className="min-w-0 flex-1 truncate">{displayName(p)}</span>
                      {ownedIds.has(p.id) ? <Badge tone="green">{t('wizard.ownedBadge')}</Badge> : <><BrandChip part={p} className="hidden sm:inline-flex" /><span className="font-semibold tabular-nums">{eur(p.price, lang)}</span></>}
                    </li>
                  ))}
                  {!r.cooler && r.cpu?.boxedCooler && <li className="flex items-center gap-2.5 text-sm text-mute"><CatBadge cat="cooler" size={26} dim />{t('common.stockCooler')}</li>}
                </ul>
                {alloc.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-mute">{t('wizard.allocation')}</div>
                    <div className="flex h-4 gap-[2px] overflow-hidden rounded-full">
                      {alloc.map((a) => <div key={a.c} title={`${t(`cat.${a.c}`)}: ${eur(a.sum, lang)}`} style={{ width: `${(a.sum / result.total) * 100}%`, background: a.color }} />)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-mute">
                      {alloc.map((a) => <span key={a.c} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: a.color }} />{t(`cat.${a.c}`)} {Math.round((a.sum / result.total) * 100)}%</span>)}
                    </div>
                  </div>
                )}
                <div className="border-t border-line pt-4"><FpsPanel r={r} /></div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
