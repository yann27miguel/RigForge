import type { Case, Cooler, FormFactor, MemType, Motherboard, Part, PSU, RAM, Socket, Storage } from './types'

/**
 * Generic parts are encoded in their id, so they survive share links and cloud sync:
 *   x:ram:DDR5:32            x:storage:nvme:2000      x:psu:650
 *   x:case:ATX               x:mb:AM5:DDR5:ATX        x:cooler:aio:360 | x:cooler:air
 * They are used for imported PCs and for "parts I already own" that are not in the catalog.
 */
export function genericPart(id: string): Part | undefined {
  if (!id.startsWith('x:')) return undefined
  const [, kind, a, b, c] = id.split(':')
  const base = { id, price: 0, tier: 'mid' as const, legacy: true, brand: 'Generic' }
  switch (kind) {
    case 'ram': {
      const memType = (a === 'DDR4' ? 'DDR4' : 'DDR5') as MemType
      const gb = Math.max(4, Number(b) || 16)
      const speed = Number(c) || (memType === 'DDR5' ? 5600 : 3200)
      return { ...base, price: Math.round(gb * (memType === 'DDR5' ? 13 : 5.5)), category: 'ram', name: `${memType} ${gb} GB`, memType, capacityGB: gb, modules: gb >= 16 ? 2 : 1, speed, cas: memType === 'DDR5' ? 36 : 16, rgb: false } satisfies RAM
    }
    case 'storage': {
      const kindMap = { nvme: 'NVMe Gen4', gen5: 'NVMe Gen5', gen3: 'NVMe Gen3', sata: 'SATA SSD', hdd: 'HDD' } as const
      const k = kindMap[(a as keyof typeof kindMap) ?? 'nvme'] ?? 'NVMe Gen4'
      const gb = Number(b) || 1000
      const ff = k === 'HDD' ? '3.5"' : k === 'SATA SSD' ? '2.5"' : 'M.2'
      const read = k === 'HDD' ? 180 : k === 'SATA SSD' ? 550 : k === 'NVMe Gen3' ? 3500 : k === 'NVMe Gen5' ? 12000 : 7000
      return { ...base, price: Math.round((k === 'HDD' ? 0.027 : k === 'NVMe Gen5' ? 0.15 : 0.085) * gb + 15), category: 'storage', name: `${k} ${gb >= 1000 ? gb / 1000 + ' TB' : gb + ' GB'}`, kind: k, capacityGB: gb, readMBs: read, writeMBs: Math.round(read * 0.85), formFactor: ff, dram: k !== 'NVMe Gen4' } satisfies Storage
    }
    case 'psu': {
      const w = Number(a) || 650
      const eff = ({ bronze: '80+ Bronze', gold: '80+ Gold', platinum: '80+ Platinum', titanium: '80+ Titanium' } as const)[(b as 'gold') ?? 'gold'] ?? '80+ Gold'
      return { ...base, price: Math.round(w * 0.13 + 10), category: 'psu', name: `${w} W ${eff}`, wattage: w, efficiency: eff, modular: 'semi', formFactor: a === 'sfx' ? 'SFX' : 'ATX', atx3: false, native12V2x6: false, warrantyYears: 5 } satisfies PSU
    }
    case 'case': {
      const ff = (['ATX', 'mATX', 'ITX'].includes(a) ? a : 'ATX') as FormFactor
      const supports: FormFactor[] = ff === 'ATX' ? ['ATX', 'mATX', 'ITX'] : ff === 'mATX' ? ['mATX', 'ITX'] : ['ITX']
      const dims = ff === 'ITX' ? { d: 380, h: 300, w: 190 } : ff === 'mATX' ? { d: 420, h: 440, w: 210 } : { d: 450, h: 480, w: 220 }
      return { ...base, price: 90, category: 'case', name: `${ff} case`, supports, maxGpuMm: ff === 'ITX' ? 320 : 360, maxCoolerMm: ff === 'ITX' ? 150 : 165, maxRadiatorMm: ff === 'ITX' ? 240 : 360, psuForms: ff === 'ITX' ? ['SFX', 'ATX'] : ['ATX'], includedFans: 2, maxFans: 6, panel: 'mesh+glass', size: ff === 'ITX' ? 'sff' : ff === 'mATX' ? 'compact' : 'mid', dims, drive35: ff === 'ITX' ? 0 : 2, rgb: false } satisfies Case
    }
    case 'mb': {
      const socket = (['AM5', 'AM4', 'LGA1700', 'LGA1851'].includes(a) ? a : 'AM5') as Socket
      const memType = (b === 'DDR4' ? 'DDR4' : 'DDR5') as MemType
      const ff = (['ATX', 'mATX', 'ITX'].includes(c) ? c : 'ATX') as FormFactor
      const chipset = { AM5: 'B650', AM4: 'B550', LGA1700: 'B760', LGA1851: 'B860' }[socket]
      return { ...base, price: { AM5: 160, AM4: 110, LGA1700: 140, LGA1851: 190 }[socket], category: 'motherboard', name: `${chipset} ${ff} board`, socket, chipset, formFactor: ff, memType, memSlots: ff === 'ITX' ? 2 : 4, maxMemGB: 128, m2Slots: ff === 'ITX' ? 2 : 2, sataPorts: 4, wifi: null, pcieGpu: 4, vrm: 'good' } satisfies Motherboard
    }
    case 'cooler': {
      const aio = a === 'aio'
      const rad = Number(b) || 240
      return { ...base, price: aio ? (rad >= 360 ? 110 : 85) : 40, category: 'cooler', name: aio ? `AIO ${rad} mm` : 'Tower air cooler', type: aio ? 'aio' : 'air', heightMm: aio ? undefined : 155, radiatorMm: aio ? rad : undefined, sockets: ['AM5', 'AM4', 'LGA1700', 'LGA1851'], tdpRating: aio ? 250 : 200, noiseDb: 28, rgb: false } satisfies Cooler
    }
  }
  return undefined
}
