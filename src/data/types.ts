export type Category =
  | 'cpu'
  | 'cooler'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'psu'
  | 'case'
  | 'fans'

export const CATEGORIES: Category[] = ['cpu', 'cooler', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case', 'fans']
export const REQUIRED: Category[] = ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case']

export type Socket = 'AM5' | 'AM4' | 'LGA1700' | 'LGA1851'
export type MemType = 'DDR5' | 'DDR4'
export type FormFactor = 'E-ATX' | 'ATX' | 'mATX' | 'ITX'
export type PsuForm = 'ATX' | 'SFX'
export type Color = 'black' | 'white'
export type Tier = 'budget' | 'mid' | 'high' | 'enthusiast'

interface Base {
  id: string
  brand: string
  name: string
  /** reference price in EUR (estimate, see PRICE_DATE) */
  price: number
  tier: Tier
  color?: Color
  /** previous-generation or generic part: recognised in imports / owned parts, hidden from the shop list */
  legacy?: boolean
}

export interface CPU extends Base {
  category: 'cpu'
  socket: Socket
  cores: number
  threads: number
  baseGHz: number
  boostGHz: number
  tdp: number
  /** realistic peak package power in W, used for PSU sizing */
  maxPower: number
  l3MB: number
  igpu: boolean
  memTypes: MemType[]
  boxedCooler: boolean
  /** gaming index, 100 = Ryzen 7 9800X3D */
  gaming: number
  /** multithread index, 100 = Ryzen 9 9950X */
  multi: number
}

export interface Cooler extends Base {
  category: 'cooler'
  type: 'air' | 'aio'
  heightMm?: number
  radiatorMm?: number
  sockets: Socket[]
  /** heat it can comfortably remove, W */
  tdpRating: number
  noiseDb: number
  rgb: boolean
  lcd?: boolean
}

export interface Motherboard extends Base {
  category: 'motherboard'
  socket: Socket
  chipset: string
  formFactor: FormFactor
  memType: MemType
  memSlots: number
  maxMemGB: number
  m2Slots: number
  sataPorts: number
  wifi: string | null
  pcieGpu: 4 | 5
  vrm: 'basic' | 'good' | 'excellent'
}

export interface RAM extends Base {
  category: 'ram'
  memType: MemType
  capacityGB: number
  modules: number
  speed: number
  cas: number
  rgb: boolean
}

export interface GPU extends Base {
  category: 'gpu'
  chip: string
  maker: 'NVIDIA' | 'AMD' | 'Intel'
  vramGB: number
  vramType: string
  tdp: number
  lengthMm: number
  slots: number
  recommendedPsu: number
  power: '12V-2x6' | '1x8-pin' | '2x8-pin' | '3x8-pin'
  /** raster index at 1440p, 100 = RTX 5090 */
  gaming: number
  /** ray-tracing index, 100 = RTX 5090 */
  rt: number
  upscaler: string
  rgb: boolean
}

export interface Storage extends Base {
  category: 'storage'
  kind: 'NVMe Gen5' | 'NVMe Gen4' | 'NVMe Gen3' | 'SATA SSD' | 'HDD'
  capacityGB: number
  readMBs: number
  writeMBs: number
  formFactor: 'M.2' | '2.5"' | '3.5"'
  dram: boolean
  tbw?: number
}

export interface PSU extends Base {
  category: 'psu'
  wattage: number
  efficiency: '80+ Bronze' | '80+ Gold' | '80+ Platinum' | '80+ Titanium'
  modular: 'full' | 'semi' | 'none'
  formFactor: PsuForm
  atx3: boolean
  native12V2x6: boolean
  warrantyYears: number
}

export interface Case extends Base {
  category: 'case'
  supports: FormFactor[]
  maxGpuMm: number
  maxCoolerMm: number
  maxRadiatorMm: number
  psuForms: PsuForm[]
  includedFans: number
  maxFans: number
  panel: 'glass' | 'mesh+glass' | 'mesh'
  size: 'full' | 'mid' | 'compact' | 'sff'
  /** outer dimensions in mm: depth (front→back), height, width */
  dims: { d: number; h: number; w: number }
  drive35: number
  rgb: boolean
}

export interface Fans extends Base {
  category: 'fans'
  count: number
  sizeMm: 120 | 140
  rgb: boolean
  airflowCFM: number
  noiseDb: number
}

export type Part = CPU | Cooler | Motherboard | RAM | GPU | Storage | PSU | Case | Fans

export type PartOf<C extends Category> = Extract<Part, { category: C }>

export interface Build {
  cpu?: string
  cooler?: string
  motherboard?: string
  ram?: string
  gpu?: string
  storage: string[]
  psu?: string
  case?: string
  fans?: string
}

export interface ResolvedBuild {
  cpu?: CPU
  cooler?: Cooler
  motherboard?: Motherboard
  ram?: RAM
  gpu?: GPU
  storage: Storage[]
  psu?: PSU
  case?: Case
  fans?: Fans
}
