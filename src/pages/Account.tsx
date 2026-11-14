import { BadgeCheck, Cloud, KeyRound, LogOut, Mail, MailCheck, RefreshCw, ShieldAlert, Trash2, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CatBadge } from '../components/icons'
import { Badge, Button, Card, SectionTitle, Segmented, cx } from '../components/ui'
import { displayName, getPart } from '../data/parts'
import { CATEGORIES, type Part } from '../data/types'
import { LANGS, useT } from '../i18n'
import { useAuth } from '../store/auth'
import { useBuild } from '../store/build'
import { useSettings, type ThemeMode } from '../store/settings'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

const input = 'h-11 w-full rounded-xl border border-ink/10 bg-ink/[0.04] px-3.5 text-sm outline-none transition focus:border-accent/60'

function Messages() {
  const { t } = useT()
  const { error, info } = useAuth()
  return (
    <>
      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{t(`auth.err.${error}`)}</p>}
      {info && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{t(`auth.msg.${info}`)}</p>}
    </>
  )
}

function AuthForm() {
  const { t } = useT()
  const { mode, busy, google, signIn, signUp, reset, clearMessages } = useAuth()
  const [view, setView] = useState<'in' | 'up' | 'reset'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [demoGmail, setDemoGmail] = useState<string | null>(null)
  useEffect(() => clearMessages(), [view, clearMessages])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (view === 'in') signIn(email, password)
    else if (view === 'up') signUp(name, email, password)
    else reset(email)
  }
  return (
    <Card className="p-6 sm:p-8">
      {view !== 'reset' && (
        <div className="mb-6"><Segmented value={view} onChange={(v) => setView(v)} options={[{ id: 'in', label: t('auth.signIn') }, { id: 'up', label: t('auth.signUp') }]} /></div>
      )}
      {mode === 'demo' && <p className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-200">{t('auth.demo')}</p>}
      {view !== 'reset' && (
        <>
          {demoGmail === null ? (
            <button type="button" disabled={busy} onClick={() => (mode === 'demo' ? setDemoGmail('') : google())} className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-ink/15 bg-white text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50">
              <GoogleLogo />{t('auth.google')}
            </button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); google(demoGmail) }} className="space-y-2 rounded-xl border border-ink/10 p-3">
              <label className="text-xs text-mute" htmlFor="demo-gmail">{t('auth.demoGoogle')}</label>
              <div className="flex gap-2">
                <input id="demo-gmail" type="email" autoComplete="email" value={demoGmail} onChange={(e) => setDemoGmail(e.target.value)} placeholder="name@gmail.com" className={input} />
                <Button type="submit" variant="primary" disabled={busy}>OK</Button>
              </div>
            </form>
          )}
          <div className="my-5 flex items-center gap-3 text-xs text-mute"><span className="h-px flex-1 bg-line" />{t('auth.or')}<span className="h-px flex-1 bg-line" /></div>
        </>
      )}
      <form onSubmit={submit} className="space-y-3">
        {view === 'up' && (
          <label className="block"><span className="mb-1 block text-xs font-medium text-mute">{t('auth.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} /></label>
        )}
        <label className="block"><span className="mb-1 block text-xs font-medium text-mute">{t('auth.email')}</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@gmail.com" className={input} /></label>
        {view !== 'reset' && (
          <label className="block"><span className="mb-1 flex justify-between text-xs font-medium text-mute">{t('auth.password')}{view === 'up' && <span>{t('auth.passwordHint')}</span>}</span>
            <input type="password" required minLength={view === 'up' ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={view === 'up' ? 'new-password' : 'current-password'} className={input} /></label>
        )}
        <Messages />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
          {view === 'in' ? t('auth.submitIn') : view === 'up' ? t('auth.submitUp') : t('auth.sendReset')}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        {view === 'reset' ? <button className="text-accent hover:underline" onClick={() => setView('in')}>{t('auth.back')}</button>
          : view === 'in' ? <button className="text-mute hover:text-ink" onClick={() => setView('reset')}>{t('auth.forgot')}</button> : null}
      </div>
    </Card>
  )
}

function VerifyPanel() {
  const { t } = useT()
  const { user, mode, busy, demoCode, sendVerification, verifyDemo, refresh, signOut } = useAuth()
  const [code, setCode] = useState('')
  if (!user) return null
  return (
    <Card className="mx-auto max-w-xl p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent"><MailCheck size={22} /></div><h2 className="font-display text-xl font-semibold">{t('auth.verifyTitle')}</h2></div>
      <p className="mb-5 text-sm text-ink2">{t(mode === 'demo' ? 'auth.verifyTextDemo' : 'auth.verifyText', { email: user.email })}</p>
      {mode === 'demo' && demoCode && (
        <div className="mb-5 rounded-xl border border-dashed border-accent/40 bg-accent/[0.06] p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent"><Mail size={13} />{t('auth.demoInbox')}</div>
          <p className="text-sm text-ink2">{t('auth.demoCodeText')} <span className="font-mono text-lg font-bold tracking-[0.3em] text-ink">{demoCode}</span></p>
        </div>
      )}
      <div className="space-y-3">
        {mode === 'demo' ? (
          <form onSubmit={(e) => { e.preventDefault(); verifyDemo(code) }} className="flex gap-2">
            <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" aria-label={t('auth.code')} className={cx(input, 'font-mono tracking-[0.3em]')} />
            <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>{t('auth.verifyBtn')}</Button>
          </form>
        ) : (
          <Button variant="primary" className="w-full" disabled={busy} onClick={() => refresh()}><RefreshCw size={15} />{t('auth.iVerified')}</Button>
        )}
        <Messages />
        <div className="flex justify-between">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => sendVerification()}><Mail size={14} />{t('auth.resend')}</Button>
          <Button variant="ghost" size="sm" onClick={() => signOut()}><LogOut size={14} />{t('auth.signOut')}</Button>
        </div>
      </div>
    </Card>
  )
}

function Profile() {
  const { t, lang } = useT()
  const { user, mode, busy, rename, signOut, deleteAccount } = useAuth()
  const { saved, owned } = useBuild()
  const settings = useSettings()
  const [name, setName] = useState(user?.displayName ?? '')
  const [armed, setArmed] = useState(false)
  if (!user) return null
  const ownedParts: Part[] = [...CATEGORIES.filter((c) => c !== 'storage').map((c) => getPart(owned[c as Exclude<typeof c, 'storage'>])), ...owned.storage.map((id) => getPart(id))].filter((p): p is Part => !!p)
  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase()
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <Card className="surface-metal p-6">
          <div className="flex items-center gap-4">
            {user.photoURL ? <img src={user.photoURL} alt="" className="size-16 rounded-2xl object-cover" referrerPolicy="no-referrer" /> : <div className="mat mat-motherboard size-16 font-display text-xl font-bold">{initials}</div>}
            <div className="min-w-0">
              <div className="truncate font-display text-xl font-semibold">{user.displayName}</div>
              <div className="truncate text-sm text-mute">{user.email}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone={user.emailVerified ? 'green' : 'amber'}>{user.emailVerified ? <BadgeCheck size={12} /> : <ShieldAlert size={12} />}{t(user.emailVerified ? 'auth.verified' : 'auth.notVerified')}</Badge>
                <Badge tone="slate">{user.provider === 'google' ? <GoogleLogo /> : <KeyRound size={12} />}{t(user.provider === 'google' ? 'auth.providerGoogle' : 'auth.providerPassword')}</Badge>
                {mode === 'demo' && <Badge tone="amber">Demo</Badge>}
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-sm text-ink2"><Cloud size={16} className="mt-0.5 shrink-0 text-accent" />{t(mode === 'demo' ? 'auth.syncDemo' : 'auth.syncOn')}</div>
        </Card>
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{t('auth.prefs')}</h2>
          <form onSubmit={(e) => { e.preventDefault(); rename(name) }}>
            <label className="mb-1 block text-xs font-medium text-mute" htmlFor="dn">{t('auth.rename')}</label>
            <div className="flex gap-2"><input id="dn" value={name} onChange={(e) => setName(e.target.value)} className={input} /><Button type="submit" disabled={busy}>{t('auth.saveName')}</Button></div>
          </form>
          <div><div className="mb-1 text-xs font-medium text-mute">{t('auth.theme')}</div>
            <Segmented<ThemeMode> size="sm" value={settings.theme} onChange={(v) => settings.set({ theme: v })} options={[{ id: 'light', label: t('theme.light') }, { id: 'dark', label: t('theme.dark') }, { id: 'system', label: t('theme.system') }]} /></div>
          <div><div className="mb-1 text-xs font-medium text-mute">{t('auth.language')}</div>
            <Segmented size="sm" value={lang} onChange={(v) => settings.set({ lang: v })} options={LANGS.map((l) => ({ id: l.id, label: l.label }))} /></div>
          <Messages />
        </Card>
        <Card className="p-6">
          <h2 className="mb-3 font-display text-lg font-semibold">{t('auth.danger')}</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => signOut()}><LogOut size={15} />{t('auth.signOut')}</Button>
            <Button variant="danger" disabled={busy} onClick={() => { if (armed) deleteAccount(); else { setArmed(true); setTimeout(() => setArmed(false), 4000) } }}><Trash2 size={15} />{armed ? t('auth.delConfirm') : t('auth.del')}</Button>
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">{t('auth.stats')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/builds" className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4 hover:border-accent/40"><div className="font-display text-3xl font-bold">{saved.length}</div><div className="text-sm text-mute">{t('auth.savedBuilds')}</div></Link>
            <Link to="/wizard" className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4 hover:border-accent/40"><div className="font-display text-3xl font-bold">{ownedParts.length}</div><div className="text-sm text-mute">{t('auth.ownedParts')}</div></Link>
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">{t('auth.ownedParts')}</h2><Link to="/wizard"><Button size="sm">{t('auth.editOwned')}</Button></Link></div>
          {ownedParts.length === 0 ? <p className="text-sm text-mute">{t('auth.noOwned')}</p> : (
            <ul className="space-y-2">{ownedParts.map((p, i) => <li key={p.id + i} className="flex items-center gap-3 text-sm"><CatBadge cat={p.category} size={28} /><span className="min-w-0 flex-1 truncate">{displayName(p)}</span><span className="text-xs text-mute">{t(`cat.${p.category}`)}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function Account() {
  const { t, list } = useT()
  const { user, ready } = useAuth()
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SectionTitle kicker={t('auth.account')} title={t('auth.title')} sub={t('auth.subtitle')} />
      {!ready ? <p className="text-mute">…</p> : !user ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="surface-metal hidden p-8 lg:block">
            <div className="mb-6 flex gap-2">{(['cpu', 'motherboard', 'gpu', 'ram', 'cooler'] as const).map((c) => <CatBadge key={c} cat={c} size={44} />)}</div>
            <ul className="space-y-4">{list('auth.benefits').map((b) => <li key={b} className="flex items-center gap-3 text-ink2"><BadgeCheck size={18} className="text-accent" />{b}</li>)}</ul>
            <div className="mt-8 flex items-center gap-2 text-xs text-mute"><UserRound size={14} />Google · Gmail · Email</div>
          </Card>
          <AuthForm />
        </div>
      ) : !user.emailVerified ? <VerifyPanel /> : <Profile />}
    </div>
  )
}
