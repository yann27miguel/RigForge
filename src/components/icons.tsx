import { CircuitBoard, Cpu, Fan, Gpu, HardDrive, MemoryStick, PcCase, Snowflake, Zap, type LucideProps } from 'lucide-react'
import { brandColor } from '../data/style'
import type { Category, Part } from '../data/types'
import { cx } from './ui'

const MAP: Record<Category, (p: LucideProps) => React.ReactElement> = {
  cpu: (p) => <Cpu {...p} />,
  cooler: (p) => <Snowflake {...p} />,
  motherboard: (p) => <CircuitBoard {...p} />,
  ram: (p) => <MemoryStick {...p} />,
  gpu: (p) => <Gpu {...p} />,
  storage: (p) => <HardDrive {...p} />,
  psu: (p) => <Zap {...p} />,
  case: (p) => <PcCase {...p} />,
  fans: (p) => <Fan {...p} />,
}

export function CatIcon({ cat, ...p }: { cat: Category } & LucideProps) {
  return MAP[cat](p)
}

/** Icon on a swatch that looks like the part's real material (PCB, copper, nickel, glass, RGB …). */
export function CatBadge({ cat, size = 36, className, dim }: { cat: Category; size?: number; className?: string; dim?: boolean }) {
  return (
    <div className={cx('mat shrink-0', `mat-${cat}`, dim && 'opacity-45 grayscale', className)} style={{ width: size, height: size }}>
      <CatIcon cat={cat} size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </div>
  )
}

/** Small brand chip: coloured dot + maker name (GPU shows the chip maker). */
export function BrandChip({ part, className }: { part: Part; className?: string }) {
  const name = part.category === 'gpu' ? part.maker : part.brand
  const c = brandColor(part)
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', className)} style={{ borderColor: c + '66', color: c, background: c + '14' }}>
      <span className="size-1.5 rounded-full" style={{ background: c }} />
      {name}
    </span>
  )
}
