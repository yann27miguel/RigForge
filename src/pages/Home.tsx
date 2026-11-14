import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Gauge, Link2, ListChecks, Rotate3d, WandSparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scene } from '../components/three/Scene'
import { Button, Card } from '../components/ui'
import { GAMES } from '../data/games'
import { PARTS } from '../data/parts'
import { PRESETS } from '../data/presets'
import { useT } from '../i18n'
import { resolve, totalPrice } from '../lib/build'
import { eur } from '../lib/format'
import { useBuild } from '../store/build'

const HERO_PRESETS = ['white', 'sweet-1440', 'enthusiast-4k', 'sff']

export default function Home() {
  const { t, lang } = useT()
  const nav = useNavigate()
  const load = useBuild((s) => s.load)
  const [idx, setIdx] = useState(0)
  const preset = PRESETS.find((p) => p.id === HERO_PRESETS[idx])!
  const r = useMemo(() => resolve(preset.build), [preset])
  const features = [
    { icon: Rotate3d, t: 'f1' }, { icon: ListChecks, t: 'f2' }, { icon: BookOpen, t: 'f3' },
    { icon: Gauge, t: 'f4' }, { icon: WandSparkles, t: 'f5' }, { icon: Link2, t: 'f6' },
  ]
  return (
    <div>
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-teal-200">{t('home.badge')}</div>
            <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl"><span className="text-gradient">{t('home.title')}</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">{t('home.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/builder"><Button variant="primary" size="lg">{t('home.ctaBuild')}<ArrowRight size={18} /></Button></Link>
              <Link to="/wizard"><Button size="lg"><WandSparkles size={18} />{t('home.ctaWizard')}</Button></Link>
              <Link to="/learn"><Button variant="ghost" size="lg"><BookOpen size={18} />{t('home.ctaLearn')}</Button></Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-4 gap-4">
              {[[PARTS.length, 'statParts'], [30, 'statChecks'], [GAMES.length, 'statGames'], [3, 'statLangs']].map(([n, k]) => (
                <div key={k}><dt className="font-display text-2xl font-bold text-ink">{n}+</dt><dd className="text-xs leading-tight text-mute">{t(`home.${k}`)}</dd></div>
              ))}
            </dl>
          </motion.div>
          <div className="relative">
            <div className="viewer-bg relative h-[420px] overflow-hidden rounded-3xl border border-line shadow-[0_0_80px_-30px_rgba(56,232,198,0.5)] sm:h-[500px]">
              <Scene r={r} interactive={false} autoRotate />
              <div className="glass absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">{preset.name[lang]}</div>
                  <div className="truncate text-xs text-mute">{preset.target} · {eur(totalPrice(r), lang)}</div>
                </div>
                <Button size="sm" variant="primary" onClick={() => { load(preset.build); nav('/builder') }}>{t('common.open')}<ArrowRight size={14} /></Button>
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {HERO_PRESETS.map((id, i) => (
                <button key={id} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-accent' : 'w-2 bg-ink/20 hover:bg-ink/40'}`} aria-label={id} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, t: k }, i) => (
            <motion.div key={k} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full p-6 transition hover:border-accent/30">
                <div className="mb-4 grid size-11 place-items-center rounded-xl bg-accent/10 text-accent"><Icon size={22} /></div>
                <h3 className="font-display text-lg font-semibold">{t(`home.${k}t`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{t(`home.${k}d`)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-panel/50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="mb-8 font-display text-2xl font-bold">{t('home.howTitle')}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {['how1', 'how2', 'how3'].map((k, i) => (
              <li key={k} className="flex gap-4 rounded-2xl border border-line bg-panel2/60 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-onaccent">{i + 1}</span>
                <p className="text-sm leading-relaxed text-ink2">{t(`home.${k}`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">{t('builds.presets')}</h2>
          <Link to="/builds" className="text-sm text-accent hover:underline">{t('nav.builds')} →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.slice(1, 9).map((p) => (
            <button key={p.id} onClick={() => { load(p.build); nav('/builder') }} className="group rounded-2xl border border-line bg-panel/80 p-5 text-left transition hover:border-ink/25">
              <div className="mb-3 h-1 w-10 rounded-full" style={{ background: p.accent }} />
              <div className="font-display font-semibold">{p.name[lang]}</div>
              <div className="mt-0.5 text-xs text-mute">{p.target}</div>
              <div className="mt-3 flex items-center justify-between"><span className="font-display text-lg font-bold">{eur(totalPrice(resolve(p.build)), lang)}</span><ArrowRight size={16} className="text-mute transition group-hover:translate-x-1 group-hover:text-accent" /></div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
