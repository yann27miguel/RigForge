import type { Part } from '../data/types'
import { capacity } from './format'

export interface SpecRow {
  k: string // i18n key under "spec."
  v: string
  /** numeric value for comparison highlighting */
  n?: number
  /** true when bigger is better, false when smaller is better */
  better?: 'high' | 'low'
}

const yes = '✓'
const no = '—'

export function specRows(p: Part): SpecRow[] {
  switch (p.category) {
    case 'cpu':
      return [
        { k: 'socket', v: p.socket },
        { k: 'cores', v: `${p.cores} / ${p.threads}`, n: p.threads, better: 'high' },
        { k: 'clock', v: `${p.baseGHz} – ${p.boostGHz} GHz`, n: p.boostGHz, better: 'high' },
        { k: 'l3', v: `${p.l3MB} MB`, n: p.l3MB, better: 'high' },
        { k: 'tdp', v: `${p.tdp} W (max ≈${p.maxPower} W)`, n: p.maxPower, better: 'low' },
        { k: 'memory', v: p.memTypes.join(' / ') },
        { k: 'igpu', v: p.igpu ? yes : no },
        { k: 'boxCooler', v: p.boxedCooler ? yes : no },
        { k: 'gamingIdx', v: `${p.gaming}`, n: p.gaming, better: 'high' },
        { k: 'multiIdx', v: `${p.multi}`, n: p.multi, better: 'high' },
      ]
    case 'cooler':
      return [
        { k: 'type', v: p.type === 'air' ? 'Air tower' : `AIO ${p.radiatorMm} mm` },
        { k: p.type === 'air' ? 'height' : 'radiator', v: p.type === 'air' ? `${p.heightMm} mm` : `${p.radiatorMm} mm` },
        { k: 'sockets', v: p.sockets.join(', ') },
        { k: 'tdpRating', v: `≈${p.tdpRating} W`, n: p.tdpRating, better: 'high' },
        { k: 'noise', v: `${p.noiseDb} dBA`, n: p.noiseDb, better: 'low' },
        { k: 'rgb', v: p.rgb ? (p.lcd ? 'RGB + LCD' : yes) : no },
      ]
    case 'motherboard':
      return [
        { k: 'socket', v: p.socket },
        { k: 'chipset', v: p.chipset },
        { k: 'formFactor', v: p.formFactor },
        { k: 'memory', v: `${p.memType} · ${p.memSlots} slots · max ${p.maxMemGB} GB`, n: p.maxMemGB, better: 'high' },
        { k: 'm2', v: `${p.m2Slots}`, n: p.m2Slots, better: 'high' },
        { k: 'sata', v: `${p.sataPorts}`, n: p.sataPorts, better: 'high' },
        { k: 'pcie', v: `PCIe ${p.pcieGpu}.0 x16`, n: p.pcieGpu, better: 'high' },
        { k: 'wifi', v: p.wifi ?? no },
        { k: 'vrm', v: p.vrm, n: { basic: 1, good: 2, excellent: 3 }[p.vrm], better: 'high' },
      ]
    case 'ram':
      return [
        { k: 'type', v: p.memType },
        { k: 'capacity', v: `${p.capacityGB} GB (${p.modules} × ${p.capacityGB / p.modules} GB)`, n: p.capacityGB, better: 'high' },
        { k: 'speed', v: `${p.speed} MT/s`, n: p.speed, better: 'high' },
        { k: 'cas', v: `CL${p.cas}`, n: p.cas, better: 'low' },
        { k: 'latency', v: `${((p.cas * 2000) / p.speed).toFixed(1)} ns`, n: (p.cas * 2000) / p.speed, better: 'low' },
        { k: 'rgb', v: p.rgb ? yes : no },
      ]
    case 'gpu':
      return [
        { k: 'chip', v: p.chip },
        { k: 'vram', v: `${p.vramGB} GB ${p.vramType}`, n: p.vramGB, better: 'high' },
        { k: 'gamingIdx', v: `${p.gaming}`, n: p.gaming, better: 'high' },
        { k: 'rtIdx', v: `${p.rt}`, n: p.rt, better: 'high' },
        { k: 'power', v: `${p.tdp} W`, n: p.tdp, better: 'low' },
        { k: 'connector', v: p.power },
        { k: 'length', v: `${p.lengthMm} mm · ${p.slots} slots`, n: p.lengthMm, better: 'low' },
        { k: 'psuRec', v: `${p.recommendedPsu} W` },
        { k: 'upscaler', v: p.upscaler },
      ]
    case 'storage':
      return [
        { k: 'interface', v: p.kind },
        { k: 'capacity', v: capacity(p.capacityGB), n: p.capacityGB, better: 'high' },
        { k: 'read', v: `${p.readMBs.toLocaleString('en')} MB/s`, n: p.readMBs, better: 'high' },
        { k: 'write', v: `${p.writeMBs.toLocaleString('en')} MB/s`, n: p.writeMBs, better: 'high' },
        { k: 'formFactor', v: p.formFactor },
        { k: 'dram', v: p.dram ? yes : no },
        { k: 'tbw', v: p.tbw ? `${p.tbw} TB` : no, n: p.tbw, better: 'high' },
      ]
    case 'psu':
      return [
        { k: 'wattage', v: `${p.wattage} W`, n: p.wattage, better: 'high' },
        { k: 'efficiency', v: p.efficiency, n: { '80+ Bronze': 1, '80+ Gold': 2, '80+ Platinum': 3, '80+ Titanium': 4 }[p.efficiency], better: 'high' },
        { k: 'modular', v: p.modular },
        { k: 'formFactor', v: p.formFactor },
        { k: 'atx3', v: p.atx3 ? yes : no },
        { k: 'connector', v: p.native12V2x6 ? '12V-2x6 ✓' : no },
        { k: 'warranty', v: `${p.warrantyYears} y`, n: p.warrantyYears, better: 'high' },
      ]
    case 'case':
      return [
        { k: 'boards', v: p.supports.join(', ') },
        { k: 'gpuMax', v: `${p.maxGpuMm} mm`, n: p.maxGpuMm, better: 'high' },
        { k: 'coolerMax', v: `${p.maxCoolerMm} mm`, n: p.maxCoolerMm, better: 'high' },
        { k: 'radiatorMax', v: p.maxRadiatorMm ? `${p.maxRadiatorMm} mm` : no, n: p.maxRadiatorMm, better: 'high' },
        { k: 'psuForm', v: p.psuForms.join(' / ') },
        { k: 'fans', v: `${p.includedFans} / ${p.maxFans}`, n: p.includedFans, better: 'high' },
        { k: 'panel', v: p.panel },
        { k: 'size', v: `${p.size} · ${Math.round((p.dims.d * p.dims.h * p.dims.w) / 1e6)} L`, n: (p.dims.d * p.dims.h * p.dims.w) / 1e6, better: 'low' },
      ]
    case 'fans':
      return [
        { k: 'count', v: `${p.count} × ${p.sizeMm} mm`, n: p.count, better: 'high' },
        { k: 'airflow', v: `${p.airflowCFM} CFM`, n: p.airflowCFM, better: 'high' },
        { k: 'noise', v: `${p.noiseDb} dBA`, n: p.noiseDb, better: 'low' },
        { k: 'rgb', v: p.rgb ? 'ARGB' : no },
      ]
  }
}

/** short one-line summary for lists */
export function keySpecs(p: Part): string {
  switch (p.category) {
    case 'cpu': return `${p.socket} · ${p.cores}C/${p.threads}T · ${p.boostGHz} GHz · ${p.l3MB} MB L3`
    case 'cooler': return p.type === 'air' ? `Air · ${p.heightMm} mm · ${p.noiseDb} dBA` : `AIO ${p.radiatorMm} mm · ${p.noiseDb} dBA`
    case 'motherboard': return `${p.socket} · ${p.chipset} · ${p.formFactor} · ${p.memType} · ${p.wifi ?? 'no Wi-Fi'}`
    case 'ram': return `${p.memType}-${p.speed} CL${p.cas} · ${p.capacityGB} GB`
    case 'gpu': return `${p.vramGB} GB ${p.vramType} · ${p.tdp} W · ${p.lengthMm} mm`
    case 'storage': return `${p.kind} · ${capacity(p.capacityGB)} · ${p.readMBs.toLocaleString('en')} MB/s`
    case 'psu': return `${p.wattage} W · ${p.efficiency} · ${p.formFactor}${p.atx3 ? ' · ATX 3' : ''}`
    case 'case': return `${p.supports[0]} · GPU ≤${p.maxGpuMm} mm · ${p.includedFans} fans`
    case 'fans': return `${p.count}× ${p.sizeMm} mm · ${p.airflowCFM} CFM${p.rgb ? ' · ARGB' : ''}`
  }
}

/** performance number used for "value" sorting */
export function perfValue(p: Part): number {
  switch (p.category) {
    case 'cpu': return p.gaming * 0.6 + p.multi * 0.4
    case 'gpu': return p.gaming
    case 'ram': return p.capacityGB * 1.5 + p.speed / 200 - p.cas
    case 'storage': return p.capacityGB / 40 + p.readMBs / 500
    case 'psu': return p.wattage / 20
    case 'motherboard': return p.m2Slots * 5 + (p.wifi ? 8 : 0) + { basic: 0, good: 8, excellent: 16 }[p.vrm]
    case 'cooler': return p.tdpRating / 5 - p.noiseDb
    case 'case': return p.includedFans * 5 + p.maxGpuMm / 20
    case 'fans': return p.count * p.airflowCFM / 10
  }
}
