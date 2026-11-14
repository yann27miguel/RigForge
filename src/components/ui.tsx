import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'ghost' | 'soft' | 'danger'
export function Button({ variant = 'soft', size = 'md', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const v = {
    primary: 'bg-accent text-onaccent hover:bg-teal-300 shadow-[0_0_24px_-6px_rgba(56,232,198,0.7)]',
    soft: 'bg-ink/[0.06] text-ink hover:bg-ink/[0.12] border border-ink/10',
    ghost: 'text-mute hover:text-ink hover:bg-ink/[0.06]',
    danger: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-400/20',
  }[variant]
  const s = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' }[size]
  return (
    <button className={cx('inline-flex items-center justify-center rounded-xl font-medium transition disabled:opacity-40 disabled:pointer-events-none', v, s, className)} {...rest}>
      {children}
    </button>
  )
}

export function Badge({ tone = 'slate', children, className }: { tone?: 'slate' | 'green' | 'amber' | 'red' | 'teal' | 'violet'; children: ReactNode; className?: string }) {
  const t = {
    slate: 'bg-ink/[0.06] text-ink2 border-ink/10',
    green: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    amber: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
    red: 'bg-rose-500/10 text-rose-300 border-rose-400/25',
    teal: 'bg-teal-400/10 text-teal-300 border-teal-400/25',
    violet: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/25',
  }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', t, className)}>{children}</span>
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-line bg-panel/80', className)}>{children}</div>
}

export function Toggle({ on, onChange, label, icon, compact }: { on: boolean; onChange: (v: boolean) => void; label: string; icon?: ReactNode; compact?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      onClick={() => onChange(!on)}
      className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition', on ? 'border-accent/40 bg-accent/15 text-teal-200' : 'border-ink/10 bg-ink/[0.04] text-mute hover:text-ink')}
    >
      {icon}
      <span className={compact ? 'hidden sm:inline' : undefined}>{label}</span>
    </button>
  )
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex rounded-xl border border-ink/10 bg-ink/[0.04] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cx('rounded-lg font-medium transition', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm', value === o.id ? 'bg-accent text-onaccent' : 'text-mute hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Meter({ value, max = 100, label, tone = 'accent', suffix }: { value: number; max?: number; label: string; tone?: 'accent' | 'violet' | 'amber' | 'rose'; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const bar = { accent: 'from-teal-400 to-emerald-300', violet: 'from-indigo-400 to-violet-300', amber: 'from-amber-400 to-yellow-300', rose: 'from-rose-500 to-orange-400' }[tone]
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="text-mute">{label}</span><span className="font-semibold tabular-nums">{Math.round(value)}{suffix}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]"><div className={cx('h-full rounded-full bg-gradient-to-r transition-all duration-700', bar)} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cx('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl sm:rounded-3xl', wide ? 'max-w-6xl' : 'max-w-lg')}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="font-display text-lg font-semibold">{title}</div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-mute hover:bg-ink/10 hover:text-ink" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SectionTitle({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      {kicker && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{kicker}</div>}
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {sub && <p className="mt-3 text-base leading-relaxed text-mute">{sub}</p>}
    </div>
  )
}
