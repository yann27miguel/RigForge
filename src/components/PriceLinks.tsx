import { ExternalLink, Globe, Play } from 'lucide-react'
import { PRICE_DATE } from '../data/parts'
import { makerSite, retailersFor, reviewLink, searchQuery } from '../data/retailers'
import type { Part } from '../data/types'
import { useT } from '../i18n'
import { eur } from '../lib/format'
import { cx } from './ui'

export function PriceLinks({ part, compact }: { part: Part; compact?: boolean }) {
  const { t, lang } = useT()
  const q = searchQuery(part)
  const site = makerSite(part)
  return (
    <div>
      {!compact && (
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-mute">{t('common.whereToBuy')}</div>
          <div className="text-xs text-mute">{t('common.refPrice')}: <span className="font-semibold text-ink">{eur(part.price, lang)}</span></div>
        </div>
      )}
      <div className={cx('flex flex-wrap gap-1.5')}>
        {retailersFor(lang).map((r) => (
          <a key={r.id} href={r.url(q)} target="_blank" rel="noopener noreferrer"
            className={cx('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition', r.kind === 'compare' ? 'border-accent/30 bg-accent/10 text-teal-200 hover:bg-accent/20' : 'border-ink/10 bg-ink/[0.04] text-ink2 hover:bg-ink/10')}>
            {r.name}<ExternalLink size={11} className="opacity-60" />
          </a>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {site && <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-300 hover:underline"><Globe size={12} />{t('common.officialSite')} ({part.brand})</a>}
        <a href={reviewLink(part)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-300 hover:underline"><Play size={12} />{t('common.reviews')}</a>
      </div>
      {!compact && <p className="mt-2 text-[11px] leading-snug text-mute">{t('common.priceNote', { date: PRICE_DATE })}</p>}
    </div>
  )
}
