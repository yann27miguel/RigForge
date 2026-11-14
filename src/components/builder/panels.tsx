import { CircleAlert, CircleCheck, CircleX, Info, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { Resolution } from '../../data/games'
import { GUIDE } from '../../data/guide'
import { displayName, getPart } from '../../data/parts'
import { CATEGORIES, type Category, type Part, type ResolvedBuild } from '../../data/types'
import { useT } from '../../i18n'
import type { CompatResult, Issue } from '../../lib/compat'
import { eur } from '../../lib/format'
import { balance, estimateAll, fpsColor, scores } from '../../lib/perf'
import { keySpecs, specRows } from '../../lib/specs'
import { useBuild } from '../../store/build'
import { useSettings } from '../../store/settings'
import { CAT_COLOR } from '../../data/style'
import { BrandChip, CatBadge, CatIcon } from '../icons'
import { Badge, Meter, Segmented, Toggle, cx } from '../ui'

/* ------------------------------------------------------------ slot list */
export function SlotList({ r, compat }: { r: ResolvedBuild; compat: CompatResult }) {
  const { t, lang } = useT()
  const { openPicker, removePart, focus, setFocus } = useBuild()
  const errorCats = new Set(compat.issues.filter((i) => i.level === 'error').flatMap((i) => i.parts))
  const warnCats = new Set(compat.issues.filter((i) => i.level === 'warn').flatMap((i) => i.parts))
  return (
    <ul className="space-y-1.5">
      {CATEGORIES.map((c) => {
        const parts: Part[] = c === 'storage' ? r.storage : r[c] ? [r[c] as Part] : []
        const need = GUIDE[c][lang].need
        const status = errorCats.has(c) && parts.length ? 'error' : warnCats.has(c) && parts.length ? 'warn' : parts.length ? 'ok' : 'empty'
        return (
          <li key={c}>
            <div
              onClick={() => setFocus(c)}
              className={cx('group cursor-pointer rounded-2xl border p-2.5 transition', focus === c ? 'border-accent/50 bg-accent/[0.06]' : 'border-line bg-panel2/50 hover:border-ink/20')}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <CatBadge cat={c} size={38} dim={status === 'empty'} />
                  {status !== 'empty' && <span className={cx('absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-panel', status === 'ok' ? 'bg-emerald-400' : status === 'error' ? 'bg-rose-500' : 'bg-amber-400')} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-mute">
                    {t(`cat.${c}`)}
                    {need === 'required' && !parts.length && <span className="text-rose-300">•</span>}
                    {need === 'optional' && <span className="text-[10px] opacity-70">({t('common.optional')})</span>}
                    {parts.length === 1 && <BrandChip part={parts[0]} className="ml-auto" />}
                  </div>
                  {parts.length === 0 ? (
                    <div className="text-sm text-mute">{c === 'cooler' && r.cpu?.boxedCooler ? t('common.stockCooler') : t('builder.emptySlot')}</div>
                  ) : (
                    parts.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1 truncate text-sm font-medium" title={displayName(p)}>{displayName(p)}</div>
                        <div className="shrink-0 text-xs font-semibold tabular-nums text-ink2">{eur(p.price, lang)}</div>
                        <button onClick={(e) => { e.stopPropagation(); removePart(c, p.id) }} className="shrink-0 rounded-md p-1 text-mute opacity-60 hover:bg-rose-500/15 hover:text-rose-300 group-hover:opacity-100" aria-label={t('common.remove')}><Trash2 size={13} /></button>
                      </div>
                    ))
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); openPicker(c) }} className={cx('grid size-8 shrink-0 place-items-center rounded-lg border transition', parts.length ? 'border-ink/10 text-mute hover:text-ink' : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20')} aria-label={t('builder.addPart', { cat: t(`cat.${c}`) })}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------ issues */
export function IssueRow({ issue }: { issue: Issue }) {
  const { t } = useT()
  const setFocus = useBuild((s) => s.setFocus)
  const params = issue.key === 'missing' ? { cat: t(`cat.${issue.params?.cat}`) } : issue.params
  const Icon = issue.level === 'error' ? CircleX : issue.level === 'warn' ? CircleAlert : Info
  return (
    <li>
      <button onClick={() => setFocus(issue.parts[0])} className={cx('flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition hover:brightness-125', issue.level === 'error' ? 'border-rose-400/25 bg-rose-500/[0.07] text-rose-200' : issue.level === 'warn' ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100' : 'border-ink/10 bg-ink/[0.03] text-ink2')}>
        <Icon size={16} className="mt-0.5 shrink-0" />
        <span>{t(`issue.${issue.key}`, params)}</span>
      </button>
    </li>
  )
}

export function IssuesList({ compat }: { compat: CompatResult }) {
  const { t } = useT()
  if (!compat.issues.length)
    return <p className="flex items-center gap-2 text-sm text-emerald-300"><CircleCheck size={16} />{t('builder.noIssues')}</p>
  return <ul className="space-y-1.5">{compat.issues.map((i, n) => <IssueRow key={i.key + n} issue={i} />)}</ul>
}

export function StatusBadge({ compat }: { compat: CompatResult }) {
  const { t } = useT()
  if (compat.errors) return <Badge tone="red"><CircleX size={12} />{t('builder.errors', { n: compat.errors })}</Badge>
  if (compat.warnings) return <Badge tone="amber"><CircleAlert size={12} />{t('builder.warnings', { n: compat.warnings })}</Badge>
  if (!compat.complete) return <Badge tone="slate"><Info size={12} />{t('builder.incomplete')}</Badge>
  return <Badge tone="green"><CircleCheck size={12} />{t('builder.ok')}</Badge>
}

/* ------------------------------------------------------------ FPS */
export function FpsPanel({ r, full }: { r: ResolvedBuild; full?: boolean }) {
  const { t } = useT()
  const { res, upscaling, set } = useSettings()
  const est = useMemo(() => estimateAll(r, res, upscaling), [r, res, upscaling])
  const bal = useMemo(() => balance(r, res), [r, res])
  const sc = useMemo(() => scores(r), [r])
  if (!est.length) return <p className="text-sm text-mute">{t('perf.noBuild')}</p>
  const maxFps = Math.max(...est.map((e) => e.fps), 60)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<Resolution> size="sm" value={res} onChange={(v) => set({ res: v })} options={[{ id: '1080p', label: '1080p' }, { id: '1440p', label: '1440p' }, { id: '4k', label: '4K' }]} />
        <Toggle on={upscaling} onChange={(v) => set({ upscaling: v })} label={full ? t('perf.upscaling') : 'DLSS/FSR'} />
      </div>
      <ul className="space-y-1.5">
        {est.map((e) => (
          <li key={e.game.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate"><span className="truncate">{e.game.name}</span>{e.vramShort && <Badge tone="amber">{t('perf.vramShort')}</Badge>}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                <div className={cx('h-full rounded-full transition-all duration-700', e.limitedBy === 'cpu' ? 'bg-gradient-to-r from-indigo-500 to-indigo-300' : 'bg-gradient-to-r from-teal-500 to-emerald-300')} style={{ width: `${Math.min(100, (e.fps / maxFps) * 100)}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className={cx('font-display text-lg font-semibold tabular-nums', fpsColor(e.fps))}>{e.fps}</div>
              {full && <div className="text-[10px] uppercase text-mute">{t('perf.limit')}: {e.limitedBy.toUpperCase()}</div>}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-3 text-[11px] text-mute"><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-teal-400" />{t('perf.gpuLim')}</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-indigo-400" />{t('perf.cpuLim')}</span></div>
      {bal && (
        <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-mute">{t('perf.balance')}</div>
          <div className="relative h-2 rounded-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-400">
            <div className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-panel shadow transition-all duration-700" style={{ left: `${((bal.value + 1) / 2) * 100}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-mute"><span>CPU</span><span>⚖</span><span>GPU</span></div>
          <p className="mt-2 text-sm text-ink2">{t(bal.verdict === 'cpu' ? 'perf.vCpu' : bal.verdict === 'gpu' ? 'perf.vGpu' : 'perf.vBalanced')}</p>
        </div>
      )}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-mute">{t('perf.scores')}</div>
        <Meter label={t('perf.sGaming')} value={sc.gaming} />
        <Meter label={t('perf.sWork')} value={sc.work} tone="violet" />
        <Meter label={t('perf.sRt')} value={sc.rt} tone="amber" />
        <Meter label={t('perf.sAi')} value={sc.ai} tone="rose" />
      </div>
      <p className="text-[11px] leading-snug text-mute">{t('perf.disclaimer')}</p>
    </div>
  )
}

/* ------------------------------------------------------------ spec table */
export function SpecTable({ part }: { part: Part }) {
  const { t } = useT()
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {specRows(part).map((s) => (
        <div key={s.k} className="contents">
          <dt className="text-mute">{t(`spec.${s.k}`)}</dt>
          <dd className="text-right font-medium">{s.v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function MiniPart({ id }: { id: string }) {
  const { lang } = useT()
  const p = getPart(id)
  if (!p) return null
  return (
    <div className="flex items-center gap-2 text-sm">
      <CatIcon cat={p.category as Category} size={14} style={{ color: CAT_COLOR[p.category as Category] }} />
      <span className="min-w-0 flex-1 truncate">{displayName(p)}</span>
      <span className="text-xs text-mute">{keySpecs(p).split(' · ')[0]}</span>
      <span className="font-semibold tabular-nums">{eur(p.price, lang)}</span>
    </div>
  )
}
