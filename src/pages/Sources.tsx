import { ExternalLink } from 'lucide-react'
import { Card, SectionTitle } from '../components/ui'
import { PRICE_DATE } from '../data/parts'
import { REFERENCES, RETAILERS, type Reference } from '../data/retailers'
import { useT } from '../i18n'

const TOPICS: Reference['topic'][] = ['prices', 'builders', 'specs', 'reviews', 'psu', 'guides']

export default function Sources() {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.sources')} title={t('sources.title')} sub={t('sources.subtitle')} />
      <Card className="mb-8 p-6">
        <h2 className="mb-3 font-display text-lg font-semibold">{t('sources.method')}</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink2">
          {['m1', 'm2', 'm3', 'm4'].map((k) => <li key={k}>{t(`sources.${k}`)}</li>)}
        </ul>
        <p className="mt-4 text-xs text-mute">{t('common.priceNote', { date: PRICE_DATE })}</p>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {TOPICS.map((topic) => (
          <Card key={topic} className="p-5">
            <h3 className="mb-3 font-display font-semibold">{t(`sources.topics.${topic}`)}</h3>
            <ul className="space-y-2">
              {REFERENCES.filter((r) => r.topic === topic).map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-2 rounded-lg p-2 text-sm hover:bg-ink/[0.05]">
                    <span className="text-ink group-hover:text-accent">{r.name}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-mute">{r.lang}<ExternalLink size={11} /></span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <Card className="p-5">
          <h3 className="mb-3 font-display font-semibold">{t('common.whereToBuy')}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {RETAILERS.map((r) => <li key={r.id}><span className="inline-block rounded-lg border border-ink/10 bg-ink/[0.04] px-2 py-1 text-xs text-ink2">{r.name}</span></li>)}
          </ul>
        </Card>
      </div>
    </div>
  )
}
