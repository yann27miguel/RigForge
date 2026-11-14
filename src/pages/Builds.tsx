import { ArrowRight, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/builder/panels'
import { CatIcon } from '../components/icons'
import { CAT_COLOR } from '../data/style'
import { Button, Card, SectionTitle } from '../components/ui'
import { displayName } from '../data/parts'
import { PRESETS } from '../data/presets'
import type { Build } from '../data/types'
import { useT } from '../i18n'
import { partsInBuild, resolve, totalPrice } from '../lib/build'
import { checkBuild } from '../lib/compat'
import { eur } from '../lib/format'
import { scores } from '../lib/perf'
import { useBuild } from '../store/build'

function BuildCard({ name, desc, target, accent, build, onDelete }: { name: string; desc?: string; target?: string; accent?: string; build: Build; onDelete?: () => void }) {
  const { t, lang } = useT()
  const nav = useNavigate()
  const load = useBuild((s) => s.load)
  const r = resolve(build)
  const sc = scores(r)
  return (
    <Card className="flex flex-col p-5 transition hover:border-ink/20">
      <div className="mb-3 h-1 w-12 rounded-full" style={{ background: accent ?? '#38e8c6' }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{name}</h3>
          {target && <div className="text-xs font-medium text-accent">{target}</div>}
        </div>
        <div className="text-right font-display text-xl font-bold tabular-nums">{eur(totalPrice(r), lang)}</div>
      </div>
      {desc && <p className="mt-2 text-sm leading-relaxed text-mute">{desc}</p>}
      <ul className="mt-4 flex-1 space-y-1.5">
        {partsInBuild(r).map((p, i) => (
          <li key={p.id + i} className="flex items-center gap-2 text-[13px] text-ink2"><CatIcon cat={p.category} size={13} className="shrink-0" style={{ color: CAT_COLOR[p.category] }} /><span className="truncate">{displayName(p)}</span></li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3 text-xs text-mute">
        <span>{t('perf.sGaming')} <b className="text-ink">{sc.gaming}</b></span>
        <span>{t('perf.sWork')} <b className="text-ink">{sc.work}</b></span>
        <span className="ml-auto"><StatusBadge compat={checkBuild(r)} /></span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => { load(build); nav('/builder') }}>{t('common.load')}<ArrowRight size={15} /></Button>
        {onDelete && <Button variant="danger" onClick={onDelete} aria-label={t('builds.del')}><Trash2 size={15} /></Button>}
      </div>
    </Card>
  )
}

export default function Builds() {
  const { t, lang } = useT()
  const { saved, deleteSaved } = useBuild()
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.builds')} title={t('builds.title')} sub={t('builds.subtitle')} />
      <h2 className="mb-4 font-display text-xl font-semibold">{t('builds.mine')}</h2>
      {saved.length === 0 ? <p className="mb-10 text-sm text-mute">{t('builds.empty')}</p> : (
        <div className="mb-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {saved.map((s) => <BuildCard key={s.id} name={s.name} target={new Date(s.savedAt).toLocaleDateString(lang)} build={s.build} onDelete={() => deleteSaved(s.id)} />)}
        </div>
      )}
      <h2 className="mb-4 font-display text-xl font-semibold">{t('builds.presets')}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRESETS.map((p) => <BuildCard key={p.id} name={p.name[lang]} desc={p.desc[lang]} target={p.target} accent={p.accent} build={p.build} />)}
      </div>
    </div>
  )
}
