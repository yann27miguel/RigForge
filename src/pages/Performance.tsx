import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FpsPanel } from '../components/builder/panels'
import { Button, Card, SectionTitle, cx } from '../components/ui'
import { displayName, partsOf } from '../data/parts'
import { useT } from '../i18n'
import { resolve } from '../lib/build'
import { eur } from '../lib/format'
import { estimateAll } from '../lib/perf'
import { useBuild } from '../store/build'
import { useSettings } from '../store/settings'

export default function Performance() {
  const { t, lang } = useT()
  const { build, addPart } = useBuild()
  const { res, upscaling } = useSettings()
  const r = useMemo(() => resolve(build), [build])
  const swap = useMemo(() => {
    if (!r.cpu) return []
    return partsOf('gpu').map((g) => {
      const est = estimateAll({ ...r, gpu: g }, res, upscaling).filter((e) => e.game.genre !== 'esports')
      const avg = est.reduce((s, e) => s + e.fps, 0) / Math.max(1, est.length)
      return { g, avg }
    }).sort((a, b) => b.avg - a.avg)
  }, [r, res, upscaling])
  const top = Math.max(1, ...swap.map((s) => s.avg))
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <SectionTitle kicker={t('nav.performance')} title={t('perf.title')} sub={t('perf.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          {r.cpu && <div className="mb-4 text-sm text-mute">{displayName(r.cpu)}{r.gpu ? ` + ${displayName(r.gpu)}` : ''}</div>}
          <FpsPanel r={r} full />
          {!r.cpu && <Link to="/builder" className="mt-4 inline-block"><Button variant="primary">{t('home.ctaBuild')}<ArrowRight size={16} /></Button></Link>}
        </Card>
        {swap.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-1 font-display text-lg font-semibold">{t('perf.gpuSwap')}</h2>
            <p className="mb-4 text-xs text-mute">Ø FPS (AAA/RPG/Sim) · {res} · {displayName(r.cpu!)}</p>
            <ul className="space-y-2">
              {swap.map(({ g, avg }) => (
                <li key={g.id}>
                  <button onClick={() => addPart(g)} className={cx('grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-ink/[0.05]', r.gpu?.id === g.id && 'bg-accent/10 ring-1 ring-accent/40')}>
                    <div className="min-w-0">
                      <div className="flex justify-between gap-2"><span className="truncate">{g.chip} <span className="text-mute">{g.vramGB} GB</span></span><span className="text-xs text-mute">{eur(g.price, lang)}</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-400" style={{ width: `${(avg / top) * 100}%` }} /></div>
                    </div>
                    <span className="w-10 text-right font-display font-semibold tabular-nums">{Math.round(avg)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
