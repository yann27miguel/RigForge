import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CatBadge } from '../components/icons'
import { NeedBadge, PartGuide } from '../components/PartGuide'
import { Button, Card, SectionTitle } from '../components/ui'
import { partsOf } from '../data/parts'
import { CATEGORIES } from '../data/types'
import { useT } from '../i18n'
import { eur } from '../lib/format'
import { useBuild } from '../store/build'

export default function Learn() {
  const { t, lang } = useT()
  const nav = useNavigate()
  const { openPicker, setFocus } = useBuild()
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.learn')} title={t('learn.title')} sub={t('learn.subtitle')} />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="lg:sticky lg:top-24 lg:self-start" aria-label={t('learn.jump')}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-mute">{t('learn.jump')}</div>
          <ul className="flex flex-wrap gap-1.5 lg:flex-col">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <a href={`#/learn`} onClick={(e) => { e.preventDefault(); document.getElementById(`g-${c}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-ink2 hover:bg-ink/[0.06]">
                  <CatBadge cat={c} size={24} />{t(`cat.${c}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6">
          {CATEGORIES.map((c) => {
            const ps = partsOf(c)
            const min = Math.min(...ps.map((p) => p.price))
            const max = Math.max(...ps.map((p) => p.price))
            return (
              <Card key={c} className="scroll-mt-24 p-6" >
                <section id={`g-${c}`} className="scroll-mt-24">
                  <PartGuide cat={c} />
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <div className="flex items-center gap-2 text-sm text-mute"><NeedBadge cat={c} /> {ps.length} {t('common.parts')} · {eur(min, lang)} – {eur(max, lang)}</div>
                    <Button size="sm" variant="primary" onClick={() => { setFocus(c); nav('/builder'); setTimeout(() => openPicker(c), 250) }}><Plus size={14} />{t('learn.inBuilder')}</Button>
                  </div>
                </section>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
