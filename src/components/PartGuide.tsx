import { AlertTriangle, CircleX, Lightbulb, ListChecks, ShieldAlert, Sparkles } from 'lucide-react'
import { GUIDE } from '../data/guide'
import type { Category } from '../data/types'
import { useT } from '../i18n'
import { CatBadge } from './icons'
import { Badge, cx } from './ui'

export function NeedBadge({ cat }: { cat: Category }) {
  const { t, lang } = useT()
  const need = GUIDE[cat][lang].need
  return <Badge tone={need === 'required' ? 'red' : need === 'conditional' ? 'amber' : 'slate'}>{t(`need.${need}`)}</Badge>
}

export function PartGuide({ cat, dense, sections = 'all' }: { cat: Category; dense?: boolean; sections?: 'all' | 'specs' }) {
  const { t, lang } = useT()
  const g = GUIDE[cat][lang]
  const box = 'rounded-xl border p-3'
  if (sections === 'specs')
    return (
      <ul className="space-y-2">
        {g.specs.map((s) => (
          <li key={s.name} className="text-sm"><span className="font-semibold text-ink">{s.name}</span> <span className="text-mute">– {s.why}</span></li>
        ))}
      </ul>
    )
  return (
    <div className={cx('space-y-3', dense ? 'text-[13px]' : 'text-sm')}>
      <div className="flex items-start gap-3">
        <CatBadge cat={cat} size={46} />
        <div>
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-semibold">{g.title}</h3><NeedBadge cat={cat} /></div>
          <p className="text-mute">{g.role}</p>
        </div>
      </div>
      <p className="leading-relaxed text-ink2">{g.purpose}</p>
      <p className="rounded-lg bg-ink/[0.03] px-3 py-2 text-mute"><Sparkles size={13} className="mr-1 inline text-accent2" />{t('detail.analogy')}: <em className="text-ink2">{g.analogy}</em></p>
      <div className={cx(box, 'border-rose-400/20 bg-rose-500/[0.06]')}>
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-rose-300"><CircleX size={15} />{t('detail.missing')}</div>
        <p className="text-ink2">{g.missing}</p>
      </div>
      <div className={cx(box, 'border-amber-400/20 bg-amber-400/[0.05]')}>
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-300"><ShieldAlert size={15} />{t('detail.skimping')}</div>
        <ul className="list-disc space-y-1 pl-5 text-ink2">{g.skimping.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      <div className={cx(box, 'border-accent/20 bg-accent/[0.04]')}>
        <div className="mb-2 flex items-center gap-1.5 font-semibold text-teal-200"><ListChecks size={15} />{t('detail.specs')}</div>
        <ul className="space-y-1.5">
          {g.specs.map((s) => (
            <li key={s.name}><span className="font-semibold text-ink">{s.name}</span> <span className="text-mute">– {s.why}</span></li>
          ))}
        </ul>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cx(box, 'border-ink/10 bg-ink/[0.02]')}>
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-300"><Lightbulb size={15} />{t('detail.tips')}</div>
          <ul className="list-disc space-y-1 pl-5 text-ink2">{g.tips.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className={cx(box, 'border-ink/10 bg-ink/[0.02]')}>
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-orange-300"><AlertTriangle size={15} />{t('detail.mistakes')}</div>
          <ul className="list-disc space-y-1 pl-5 text-ink2">{g.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>
      <p className="text-xs text-mute">{t('detail.budget')}: <span className="font-semibold text-ink">{g.budgetShare}</span></p>
    </div>
  )
}
