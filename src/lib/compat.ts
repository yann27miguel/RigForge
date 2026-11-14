import { REQUIRED, type Category, type ResolvedBuild } from '../data/types'
import { hasCategory } from './build'
import { balance } from './perf'
import { estimatePower } from './power'

export type Level = 'error' | 'warn' | 'info'

export interface Issue {
  level: Level
  key: string
  params?: Record<string, string | number>
  parts: Category[]
}

export interface CompatResult {
  issues: Issue[]
  errors: number
  warnings: number
  complete: boolean
}

export function checkBuild(r: ResolvedBuild): CompatResult {
  const issues: Issue[] = []
  const add = (level: Level, key: string, parts: Category[], params?: Issue['params']) => issues.push({ level, key, parts, params })
  const { cpu, cooler, motherboard: mb, ram, gpu, storage, psu, case: pcCase, fans } = r

  // ---- display output
  if (!gpu && cpu && !cpu.igpu) add('error', 'noDisplay', ['cpu', 'gpu'], { cpu: cpu.name })
  else if (!gpu && cpu?.igpu) add('info', 'igpuOnly', ['gpu'])

  // ---- CPU ↔ motherboard
  if (cpu && mb && cpu.socket !== mb.socket) add('error', 'socket', ['cpu', 'motherboard'], { cpu: cpu.socket, mb: mb.socket })
  if (cpu && mb?.vrm === 'basic' && cpu.maxPower > 180) add('warn', 'vrm', ['cpu', 'motherboard'], { w: cpu.maxPower })

  // ---- RAM
  if (ram && mb) {
    if (ram.memType !== mb.memType) add('error', 'ramType', ['ram', 'motherboard'], { ram: ram.memType, mb: mb.memType })
    if (ram.modules > mb.memSlots) add('error', 'ramSlots', ['ram', 'motherboard'], { n: ram.modules, slots: mb.memSlots })
    if (ram.capacityGB > mb.maxMemGB) add('error', 'ramMax', ['ram', 'motherboard'], { gb: ram.capacityGB, max: mb.maxMemGB })
  } else if (ram && cpu && !cpu.memTypes.includes(ram.memType)) {
    add('error', 'ramCpu', ['ram', 'cpu'], { ram: ram.memType, cpu: cpu.memTypes.join('/') })
  }
  if (ram && ram.capacityGB < 32 && gpu) add('info', 'ram16', ['ram'])

  // ---- case fit
  if (pcCase && mb && !pcCase.supports.includes(mb.formFactor)) add('error', 'formFactor', ['case', 'motherboard'], { mb: mb.formFactor, sup: pcCase.supports.join(', ') })
  if (pcCase && gpu) {
    if (gpu.lengthMm > pcCase.maxGpuMm) add('error', 'gpuLength', ['gpu', 'case'], { len: gpu.lengthMm, max: pcCase.maxGpuMm })
    else if (pcCase.maxGpuMm - gpu.lengthMm < 15) add('warn', 'gpuTight', ['gpu', 'case'], { left: pcCase.maxGpuMm - gpu.lengthMm })
  }

  // ---- cooling
  if (cpu && !cooler) {
    if (!cpu.boxedCooler) add('error', 'noCooler', ['cooler', 'cpu'])
    else if (cpu.maxPower > 100) add('warn', 'boxedWeak', ['cooler'])
    else add('info', 'boxed', ['cooler'])
  }
  if (cooler && cpu) {
    if (!cooler.sockets.includes(cpu.socket)) add('error', 'coolerSocket', ['cooler', 'cpu'], { s: cpu.socket })
    if (cooler.tdpRating < cpu.maxPower) add('warn', 'coolerWeak', ['cooler', 'cpu'], { c: cooler.tdpRating, w: cpu.maxPower })
  }
  if (cooler && pcCase) {
    if (cooler.type === 'air' && cooler.heightMm && cooler.heightMm > pcCase.maxCoolerMm) add('error', 'coolerHeight', ['cooler', 'case'], { h: cooler.heightMm, max: pcCase.maxCoolerMm })
    if (cooler.type === 'aio' && cooler.radiatorMm && cooler.radiatorMm > pcCase.maxRadiatorMm)
      add('error', 'radiator', ['cooler', 'case'], { r: cooler.radiatorMm, max: pcCase.maxRadiatorMm || 0 })
  }

  // ---- power
  const pw = estimatePower(r)
  if (psu && pw.total > 0) {
    if (psu.wattage < pw.total) add('error', 'psuLow', ['psu'], { w: psu.wattage, need: Math.round(pw.total) })
    else if (psu.wattage < pw.recommended) add('warn', 'psuTight', ['psu'], { w: psu.wattage, rec: pw.recommended })
    if (psu.efficiency === '80+ Bronze' && pw.total > 450) add('info', 'psuBronze', ['psu'])
  }
  if (psu && gpu?.power === '12V-2x6' && !psu.native12V2x6) add('warn', 'adapter', ['psu', 'gpu'])
  if (psu && pcCase && !pcCase.psuForms.includes(psu.formFactor)) {
    if (psu.formFactor === 'SFX') add('warn', 'sfxBracket', ['psu', 'case'])
    else add('error', 'psuForm', ['psu', 'case'], { psu: psu.formFactor, sup: pcCase.psuForms.join('/') })
  }

  // ---- storage
  const m2 = storage.filter((s) => s.formFactor === 'M.2').length
  const sata = storage.filter((s) => s.formFactor !== 'M.2').length
  const d35 = storage.filter((s) => s.formFactor === '3.5"').length
  if (mb && m2 > mb.m2Slots) add('error', 'm2', ['storage', 'motherboard'], { n: m2, slots: mb.m2Slots })
  if (mb && sata > mb.sataPorts) add('error', 'sata', ['storage', 'motherboard'], { n: sata, ports: mb.sataPorts })
  if (pcCase && d35 > pcCase.drive35) add('error', 'drive35', ['storage', 'case'], { n: d35, bays: pcCase.drive35 })
  if (storage.length && storage.every((s) => s.kind === 'HDD')) add('warn', 'hddBoot', ['storage'])
  if (storage.length && storage.reduce((s, d) => s + d.capacityGB, 0) < 1000) add('info', 'smallStorage', ['storage'])

  // ---- airflow
  if (pcCase) {
    const total = pcCase.includedFans + (fans?.count ?? 0)
    if (fans && pcCase.maxFans === 0) add('error', 'noFanMounts', ['fans', 'case'])
    else if (total > pcCase.maxFans) add('warn', 'fanSlots', ['fans', 'case'], { n: total, max: pcCase.maxFans })
    const aio = cooler?.type === 'aio'
    if (total < 2 && !aio && pcCase.maxFans > 0) add('warn', 'airflow', ['fans', 'case'], { n: total })
  }

  // ---- GPU balance
  if (gpu && gpu.vramGB <= 8) add('info', 'vram8', ['gpu'])
  if (gpu && cpu) {
    const b = balance(r, '1440p')
    if (b && b.value < -0.35) add('warn', 'cpuBottleneck', ['cpu', 'gpu'])
  }

  // ---- missing parts
  for (const c of REQUIRED) if (!hasCategory(r, c)) add('info', 'missing', [c], { cat: c })

  const order: Record<Level, number> = { error: 0, warn: 1, info: 2 }
  issues.sort((a, b) => order[a.level] - order[b.level])
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.filter((i) => i.level === 'warn').length
  const complete = REQUIRED.every((c) => hasCategory(r, c)) && (!!gpu || !!cpu?.igpu) && (!!cooler || !!cpu?.boxedCooler)
  return { issues, errors, warnings, complete }
}

/** quick check used by the part picker: would this part conflict with the current build? */
export function conflictsWith(r: ResolvedBuild, candidate: import('../data/types').Part): Issue[] {
  const base: ResolvedBuild = { ...r, storage: [...r.storage] }
  if (candidate.category !== 'storage') delete (base as unknown as Record<string, unknown>)[candidate.category]
  const test: ResolvedBuild = { ...base, storage: [...base.storage] }
  if (candidate.category === 'storage') test.storage.push(candidate)
  else (test as unknown as Record<string, unknown>)[candidate.category] = candidate
  const before = new Set(checkBuild(base).issues.filter((i) => i.level === 'error').map((i) => i.key))
  return checkBuild(test).issues.filter((i) => i.level === 'error' && i.parts.includes(candidate.category) && !before.has(i.key) && i.key !== 'missing')
}
