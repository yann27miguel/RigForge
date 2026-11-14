import { Plus, X } from 'lucide-react'
import { displayName, getPart, partsOf } from '../data/parts'
import type { Build, Category, Part } from '../data/types'
import { useT } from '../i18n'
import { useBuild } from '../store/build'
import { CatBadge } from './icons'

type Opt = { id: string; label: string }
type Group = { label: string; opts: Opt[] }

const GENERIC: Partial<Record<Category, string[]>> = {
  motherboard: ['x:mb:AM5:DDR5:ATX', 'x:mb:AM5:DDR5:mATX', 'x:mb:AM5:DDR5:ITX', 'x:mb:AM4:DDR4:ATX', 'x:mb:AM4:DDR4:mATX', 'x:mb:LGA1700:DDR5:ATX', 'x:mb:LGA1700:DDR4:ATX', 'x:mb:LGA1700:DDR4:mATX', 'x:mb:LGA1851:DDR5:ATX'],
  ram: ['x:ram:DDR5:16', 'x:ram:DDR5:32', 'x:ram:DDR5:64', 'x:ram:DDR4:8', 'x:ram:DDR4:16', 'x:ram:DDR4:32', 'x:ram:DDR4:64'],
  storage: ['x:storage:nvme:500', 'x:storage:nvme:1000', 'x:storage:nvme:2000', 'x:storage:nvme:4000', 'x:storage:sata:500', 'x:storage:sata:1000', 'x:storage:hdd:1000', 'x:storage:hdd:2000', 'x:storage:hdd:4000'],
  psu: ['x:psu:450:bronze', 'x:psu:550:bronze', 'x:psu:650:bronze', 'x:psu:650:gold', 'x:psu:750:gold', 'x:psu:850:gold', 'x:psu:1000:gold', 'x:psu:1200:platinum'],
  case: ['x:case:ATX', 'x:case:mATX', 'x:case:ITX'],
  cooler: ['x:cooler:air', 'x:cooler:aio:240', 'x:cooler:aio:280', 'x:cooler:aio:360'],
}

const ORDER: Category[] = ['gpu', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'fans']

function groupsFor(cat: Category, t: (k: string) => string): Group[] {
  const toOpt = (p: Part): Opt => ({ id: p.id, label: displayName(p) })
  const groups: Group[] = [{ label: t('wizard.groupCurrent'), opts: partsOf(cat).map(toOpt) }]
  if (cat === 'cpu' || cat === 'gpu') groups.push({ label: t('wizard.groupPrev'), opts: partsOf(cat, true).filter((p) => p.legacy).map(toOpt) })
  const gen = GENERIC[cat]
  if (gen) groups.unshift({ label: t('wizard.groupGeneric'), opts: gen.map((id) => ({ id, label: displayName(getPart(id)!) })) })
  return groups
}

/** "Which parts do you already have?" – stored in the user's profile (synced when signed in). */
export function OwnedEditor() {
  const { t } = useT()
  const { owned, setOwned } = useBuild()
  const setCat = (cat: Category, id: string) => {
    const b: Build = { ...owned, storage: [...owned.storage] }
    if (cat === 'storage') b.storage = id ? [...b.storage, id].slice(0, 3) : b.storage
    else (b as unknown as Record<string, string | undefined>)[cat] = id || undefined
    setOwned(b)
  }
  return (
    <ul className="space-y-2">
      {ORDER.map((cat) => {
        const groups = groupsFor(cat, t)
        const select = (value: string, onChange: (v: string) => void, label: string) => (
          <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-9 min-w-0 flex-1 rounded-lg border border-ink/10 bg-panel px-2 text-sm">
            <option value="">{t('wizard.dontHave')}</option>
            {groups.map((g) => g.opts.length > 0 && (
              <optgroup key={g.label} label={g.label}>{g.opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</optgroup>
            ))}
          </select>
        )
        return (
          <li key={cat} className="flex items-start gap-2.5">
            <CatBadge cat={cat} size={34} dim={cat === 'storage' ? !owned.storage.length : !owned[cat]} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs font-medium text-mute">{t(`cat.${cat}`)}</div>
              {cat === 'storage' ? (
                <div className="space-y-1.5">
                  {owned.storage.map((id, i) => (
                    <div key={id + i} className="flex items-center gap-2 rounded-lg border border-ink/10 bg-ink/[0.03] px-2.5 py-1.5 text-sm">
                      <span className="min-w-0 flex-1 truncate">{getPart(id) ? displayName(getPart(id)!) : id}</span>
                      <button onClick={() => setOwned({ ...owned, storage: owned.storage.filter((_, j) => j !== i) })} className="rounded p-0.5 text-mute hover:text-rose-300" aria-label={t('common.remove')}><X size={14} /></button>
                    </div>
                  ))}
                  {owned.storage.length < 3 && <div className="flex items-center gap-2"><Plus size={14} className="text-mute" />{select('', (v) => v && setCat('storage', v), t('cat.storage'))}</div>}
                </div>
              ) : (
                <div className="flex">{select((owned[cat] as string | undefined) ?? '', (v) => setCat(cat, v), t(`cat.${cat}`))}</div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
