import { Globe, Menu, Monitor, Moon, Sun, UserRound, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { PartPicker } from './components/builder/PartPicker'
import { cx } from './components/ui'
import { LANGS, useT } from './i18n'
import { useCloudSync } from './lib/sync'
import { useAuth } from './store/auth'
import { useSettings } from './store/settings'

const Home = lazy(() => import('./pages/Home'))
const Builder = lazy(() => import('./pages/Builder'))
const Wizard = lazy(() => import('./pages/Wizard'))
const Learn = lazy(() => import('./pages/Learn'))
const Compare = lazy(() => import('./pages/Compare'))
const Performance = lazy(() => import('./pages/Performance'))
const Builds = lazy(() => import('./pages/Builds'))
const Sources = lazy(() => import('./pages/Sources'))
const Account = lazy(() => import('./pages/Account'))
const Versus = lazy(() => import('./pages/Versus'))

const NAV = [
  ['/builder', 'builder'],
  ['/wizard', 'wizard'],
  ['/learn', 'learn'],
  ['/versus', 'compare'],
  ['/performance', 'performance'],
  ['/builds', 'builds'],
  ['/sources', 'sources'],
] as const

function Logo() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-8"><rect width="64" height="64" rx="14" fill="#0e1520" stroke="#1f2a3a" /><rect x="18" y="12" width="28" height="40" rx="4" fill="none" stroke="#38e8c6" strokeWidth="4" /><circle cx="32" cy="24" r="5" fill="#38e8c6" /><rect x="24" y="36" width="16" height="4" rx="2" fill="#7c8cff" /><rect x="24" y="43" width="16" height="4" rx="2" fill="#7c8cff" /></svg>
      <span className="font-display text-lg font-bold tracking-tight">Rig<span className="text-accent">Forge</span></span>
    </NavLink>
  )
}

function LangSwitch() {
  const { lang } = useT()
  const set = useSettings((s) => s.set)
  return (
    <div className="flex items-center gap-1 rounded-xl border border-ink/10 bg-ink/[0.04] p-1" role="group" aria-label="Language">
      <Globe size={14} className="mx-1 text-mute" />
      {LANGS.map((l) => (
        <button key={l.id} onClick={() => set({ lang: l.id })} title={l.label} className={cx('rounded-lg px-2 py-1 text-xs font-semibold transition', lang === l.id ? 'bg-accent text-onaccent' : 'text-mute hover:text-ink')}>
          {l.flag}
        </button>
      ))}
    </div>
  )
}

function ThemeSwitch() {
  const { t } = useT()
  const { theme, set } = useSettings()
  const opts = [
    { id: 'light' as const, icon: Sun, label: t('theme.light') },
    { id: 'dark' as const, icon: Moon, label: t('theme.dark') },
    { id: 'system' as const, icon: Monitor, label: t('theme.system') },
  ]
  return (
    <div className="flex w-fit items-center gap-0.5 rounded-xl border border-ink/10 bg-ink/[0.04] p-1" role="group" aria-label={t('theme.label')}>
      {opts.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => set({ theme: id })} title={label} aria-label={label} aria-pressed={theme === id} className={cx('grid size-7 place-items-center rounded-lg transition', theme === id ? 'bg-accent text-onaccent' : 'text-mute hover:text-ink')}>
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

function useApplyTheme() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const light = theme === 'light' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('light', light)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

function AccountButton() {
  const { t } = useT()
  const user = useAuth((s) => s.user)
  return (
    <NavLink to="/account" className={({ isActive }) => cx('flex h-9 items-center gap-2 rounded-xl border px-2.5 text-sm font-medium transition', isActive ? 'border-accent/50 bg-accent/10' : 'border-ink/10 bg-ink/[0.04] hover:border-ink/25')} aria-label={user ? t('auth.account') : t('auth.nav')}>
      {user?.photoURL ? <img src={user.photoURL} alt="" className="size-6 rounded-full" referrerPolicy="no-referrer" /> : user ? <span className="mat mat-motherboard size-6 rounded-full text-[10px] font-bold">{(user.displayName || user.email).slice(0, 2).toUpperCase()}</span> : <UserRound size={16} />}
      <span className="hidden max-w-[110px] truncate md:inline">{user ? user.displayName : t('auth.nav')}</span>
      {user && !user.emailVerified && <span className="size-2 rounded-full bg-amber-400" />}
    </NavLink>
  )
}

export default function App() {
  useApplyTheme()
  useCloudSync()
  const initAuth = useAuth((s) => s.init)
  useEffect(() => initAuth(), [initAuth])
  const { t, lang } = useT()
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  const isBuilder = loc.pathname.startsWith('/builder')
  useEffect(() => {
    setMenu(false)
  }, [loc.pathname])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className={cx('mx-auto flex h-16 items-center gap-4 px-4', isBuilder ? 'max-w-none' : 'max-w-7xl')}>
          <Logo />
          <nav className="ml-4 hidden items-center gap-1 xl:flex">
            {NAV.map(([to, k]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-medium transition', isActive || (to === '/versus' && loc.pathname === '/compare') ? 'bg-ink/[0.08] text-ink' : 'text-mute hover:text-ink')}>
                {t(`nav.${k}`)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block"><ThemeSwitch /></div>
            <LangSwitch />
            <AccountButton />
            <button className="rounded-lg p-2 text-mute hover:bg-ink/10 xl:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {menu && (
          <nav className="grid gap-1 border-t border-line px-4 py-3 xl:hidden">
            <div className="mb-1 sm:hidden"><ThemeSwitch /></div>
            {NAV.map(([to, k]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cx('rounded-lg px-3 py-2.5 text-sm font-medium', isActive ? 'bg-ink/[0.08]' : 'text-mute')}>
                {t(`nav.${k}`)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1">
        <Suspense fallback={<div className="grid h-[60vh] place-items-center text-mute">…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/versus" element={<Versus />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/builds" element={<Builds />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {!isBuilder && (
        <footer className="border-t border-line py-8 text-sm text-mute">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:justify-between">
            <span>{t('footer.made')}</span>
            <span className="max-w-xl sm:text-right">{t('footer.disclaimer')}</span>
          </div>
        </footer>
      )}
      <PartPicker />
    </div>
  )
}
