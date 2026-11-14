import { ClipboardPaste, ExternalLink, Globe, Link2, Loader2, Save, Search, Trash2, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { displayName, getPart, partsOf } from '../data/parts'
import type { Build, Category } from '../data/types'
import { useT } from '../i18n'
import { resolve, totalPrice } from '../lib/build'
import { eur } from '../lib/format'
import { parsePC, type Detected, type ParsedPC } from '../lib/specParser'
import { useBuild, type SavedBuild } from '../store/build'
import { CatBadge } from './icons'
import { Badge, Button, Segmented, cx } from './ui'

export const SPECS_WORKER = (import.meta.env.VITE_SPECS_WORKER_URL as string | undefined)?.replace(/\/$/, '')

const enc = encodeURIComponent
const SEARCHES = [
  { name: 'Geizhals', url: (q: string) => `https://geizhals.de/?fs=${enc(q)}` },
  { name: 'idealo', url: (q: string) => `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${enc(q)}` },
  { name: 'Google', url: (q: string) => `https://www.google.com/search?q=${enc(q + ' technische Daten specs')}` },
  { name: 'PCPartPicker', url: (q: string) => `https://de.pcpartpicker.com/search/?q=${enc(q)}` },
]

type Tab = 'link' | 'text' | 'search'

/** Import a PC (prebuilt or someone's build) from a shop link, pasted specs or a web search. */
export function ImportPC({ onUse, slotLabel }: { onUse: (b: SavedBuild) => void; slotLabel: string }) {
  const { t, lang } = useT()
  const saveImported = useBuild((s) => s.saveImported)
  const [tab, setTab] = useState<Tab>(SPECS_WORKER ? 'link' : 'text')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ParsedPC | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [saved, setSaved] = useState(false)

  const show = (r: ParsedPC, src?: string) => {
    setResult(r)
    setName(r.title?.slice(0, 80) || (src ? new URL(src).hostname.replace('www.', '') : t('import.defaultName')))
    setPrice(r.price ? String(Math.round(r.price)) : '')
    setSaved(false)
    if (!r.detected.some((d) => d.cat === 'cpu' || d.cat === 'gpu')) setError('nothingFound')
  }

  const fetchLink = async () => {
    setError(null)
    if (!/^https:\/\//i.test(url.trim())) return setError('badUrl')
    setBusy(true)
    try {
      const res = await fetch(`${SPECS_WORKER}/?url=${enc(url.trim())}`)
      const data = (await res.json()) as { title?: string; price?: number; text?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'fetch')
      show(parsePC(`${data.title ?? ''}\n${data.text ?? ''}`, { title: data.title, price: data.price }), url.trim())
    } catch (e) {
      setError(String((e as Error).message).includes('host_not_allowed') ? 'hostNotAllowed' : 'fetchFailed')
    } finally {
      setBusy(false)
    }
  }

  const detectText = () => {
    setError(null)
    if (text.trim().length < 6) return setError('nothingFound')
    show(parsePC(text))
  }

  const setPartFor = (cat: Category, id: string) => {
    if (!result) return
    const build: Build = { ...result.build, storage: [...result.build.storage] }
    ;(build as unknown as Record<string, string | undefined>)[cat] = id || undefined
    const detected: Detected[] = result.detected.filter((d) => d.cat !== cat)
    if (id) detected.push({ cat, id, match: '', exact: true })
    setResult({ ...result, build, detected })
  }
  const removeStorage = (id: string) => result && setResult({ ...result, build: { ...result.build, storage: result.build.storage.filter((s) => s !== id) }, detected: result.detected.filter((d) => d.id !== id) })

  const toSaved = (): SavedBuild => ({ id: 'imp-' + Date.now(), name: name || t('import.defaultName'), build: result!.build, savedAt: Date.now(), price: price ? Number(price) : undefined, source: url || undefined })

  const r = result ? resolve(result.build) : null
  const rows: { cat: Category; id?: string }[] = result
    ? [
        { cat: 'cpu', id: result.build.cpu }, { cat: 'gpu', id: result.build.gpu }, { cat: 'ram', id: result.build.ram },
        ...result.build.storage.map((id) => ({ cat: 'storage' as Category, id })),
        { cat: 'motherboard', id: result.build.motherboard }, { cat: 'psu', id: result.build.psu }, { cat: 'cooler', id: result.build.cooler }, { cat: 'case', id: result.build.case },
      ]
    : []

  return (
    <div className="space-y-4 p-5">
      <Segmented<Tab> size="sm" value={tab} onChange={(v) => { setTab(v); setError(null) }} options={[{ id: 'link', label: <span className="flex items-center gap-1"><Link2 size={13} />{t('import.tabLink')}</span> }, { id: 'text', label: <span className="flex items-center gap-1"><ClipboardPaste size={13} />{t('import.tabText')}</span> }, { id: 'search', label: <span className="flex items-center gap-1"><Search size={13} />{t('import.tabSearch')}</span> }]} />

      {tab === 'link' && (
        <div className="space-y-2">
          <p className="text-sm text-mute">{t('import.linkHelp')}</p>
          <div className="flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.alternate.de/…" className="h-10 min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/[0.04] px-3 text-sm outline-none focus:border-accent/60" disabled={!SPECS_WORKER} />
            <Button variant="primary" onClick={fetchLink} disabled={!SPECS_WORKER || busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}{t('import.fetch')}</Button>
          </div>
          {!SPECS_WORKER && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-200">{t('import.noWorker')}</p>}
        </div>
      )}
      {tab === 'text' && (
        <div className="space-y-2">
          <p className="text-sm text-mute">{t('import.textHelp')}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={t('import.textPlaceholder')} className="w-full rounded-xl border border-ink/10 bg-ink/[0.04] p-3 text-sm outline-none focus:border-accent/60" />
          <Button variant="primary" onClick={detectText}><Wand2 size={15} />{t('import.detect')}</Button>
        </div>
      )}
      {tab === 'search' && (
        <div className="space-y-2">
          <p className="text-sm text-mute">{t('import.searchHelp')}</p>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="NZXT Player Two, Dell XPS 8960, MSI Aegis…" className="h-10 w-full rounded-xl border border-ink/10 bg-ink/[0.04] px-3 text-sm outline-none focus:border-accent/60" />
          <div className="flex flex-wrap gap-1.5">
            {SEARCHES.map((s) => (
              <a key={s.name} href={query ? s.url(query) : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!query} className={cx('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs', query ? 'border-accent/30 bg-accent/10 text-teal-200 hover:bg-accent/20' : 'pointer-events-none border-ink/10 text-mute opacity-50')}>{s.name}<ExternalLink size={11} /></a>
            ))}
          </div>
          <p className="text-xs text-mute">{t('import.searchNext')}</p>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{t(`import.err.${error}`)}</p>}

      {result && r && (
        <div className="space-y-3 rounded-2xl border border-line bg-panel2/50 p-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
            <label className="text-xs text-mute">{t('import.name')}<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-ink/10 bg-ink/[0.04] px-2.5 text-sm text-ink" /></label>
            <label className="text-xs text-mute">{t('import.listedPrice')}<input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))} placeholder={String(totalPrice(r))} className="mt-1 h-9 w-full rounded-lg border border-ink/10 bg-ink/[0.04] px-2.5 text-sm text-ink" /></label>
          </div>
          <ul className="space-y-1.5">
            {rows.map(({ cat, id }, i) => {
              const p = id ? getPart(id) : undefined
              const d = result.detected.find((x) => x.id === id)
              const options = cat === 'cpu' || cat === 'gpu' ? partsOf(cat, true) : null
              return (
                <li key={cat + i} className="flex items-center gap-2.5 text-sm">
                  <CatBadge cat={cat} size={28} dim={!p} />
                  <div className="min-w-0 flex-1">
                    {options ? (
                      <select value={id ?? ''} onChange={(e) => setPartFor(cat, e.target.value)} className="h-8 w-full max-w-full truncate rounded-lg border border-ink/10 bg-panel px-2 text-sm" aria-label={t(`cat.${cat}`)}>
                        <option value="">{t(`cat.${cat}`)}: —</option>
                        {options.map((o) => <option key={o.id} value={o.id}>{displayName(o)}{o.legacy ? ' (prev. gen)' : ''}</option>)}
                      </select>
                    ) : (
                      <span className={p ? '' : 'text-mute'}>{p ? displayName(p) : `${t(`cat.${cat}`)}: —`}</span>
                    )}
                  </div>
                  {p && <Badge tone={d?.exact ? 'green' : 'amber'}>{t(d?.exact ? 'import.exact' : 'import.estimated')}</Badge>}
                  {cat === 'storage' && id && <button onClick={() => removeStorage(id)} className="rounded p-1 text-mute hover:text-rose-300" aria-label={t('common.remove')}><Trash2 size={13} /></button>}
                </li>
              )
            })}
          </ul>
          <p className="text-[11px] text-mute">{t('import.note')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => onUse(toSaved())}>{t('import.use', { slot: slotLabel })}</Button>
            <Button onClick={() => { saveImported(toSaved()); setSaved(true) }}><Save size={14} />{saved ? t('builder.saved') : t('import.save')}</Button>
            <span className="ml-auto text-xs text-mute">{t('common.total')}: <b className="text-ink">{eur(price ? Number(price) : totalPrice(r), lang)}</b></span>
          </div>
        </div>
      )}
    </div>
  )
}
