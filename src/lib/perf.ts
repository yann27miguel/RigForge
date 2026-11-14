import { GAMES, RES_FACTOR, type Game, type Resolution } from '../data/games'
import type { CPU, GPU, RAM, ResolvedBuild } from '../data/types'

export interface GameEstimate {
  game: Game
  fps: number
  gpuFps: number
  cpuFps: number
  limitedBy: 'cpu' | 'gpu'
  vramShort: boolean
}

const IGPU_SCORE = 4

export function estimateGame(game: Game, cpu: CPU | undefined, gpu: GPU | undefined, ram: RAM | undefined, res: Resolution, upscaling: boolean): GameEstimate | null {
  if (!cpu) return null
  const gpuScore = gpu ? gpu.gaming : cpu.igpu ? IGPU_SCORE : 0
  if (!gpuScore) return null
  const vram = gpu ? gpu.vramGB : 2
  const need = game.vram[res]
  const vramShort = vram < need
  let gpuFps = game.gpuFps4k * RES_FACTOR[res] * (gpuScore / 100) * (upscaling ? 1.4 : 1)
  if (vramShort) gpuFps *= vram <= need - 3 ? 0.55 : 0.75
  let ramFactor = 1
  if (ram) {
    if (ram.memType === 'DDR4') ramFactor *= 0.95
    if (ram.capacityGB < 32 && game.genre !== 'esports') ramFactor *= 0.9
    if (ram.capacityGB < 16) ramFactor *= 0.75
  }
  const cpuFps = game.cpuFps * (cpu.gaming / 100) * ramFactor
  const fps = Math.min(gpuFps, cpuFps)
  return { game, fps: Math.round(fps), gpuFps: Math.round(gpuFps), cpuFps: Math.round(cpuFps), limitedBy: cpuFps < gpuFps ? 'cpu' : 'gpu', vramShort }
}

export function estimateAll(r: ResolvedBuild, res: Resolution, upscaling: boolean): GameEstimate[] {
  return GAMES.map((g) => estimateGame(g, r.cpu, r.gpu, r.ram, res, upscaling)).filter((x): x is GameEstimate => !!x)
}

export interface Balance {
  /** -1 (strongly CPU-limited) … 0 balanced … +1 (strongly GPU-limited) */
  value: number
  cpuBoundShare: number
  verdict: 'cpu' | 'balanced' | 'gpu'
}

export function balance(r: ResolvedBuild, res: Resolution): Balance | null {
  const est = estimateAll(r, res, false).filter((e) => e.game.genre !== 'esports')
  if (!est.length) return null
  const ratios = est.map((e) => Math.log(e.cpuFps / e.gpuFps))
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length
  const value = Math.max(-1, Math.min(1, mean / 0.7))
  const cpuBoundShare = est.filter((e) => e.limitedBy === 'cpu').length / est.length
  const verdict = value < -0.15 ? 'cpu' : value > 0.45 ? 'gpu' : 'balanced'
  return { value, cpuBoundShare, verdict }
}

export interface Scores {
  gaming: number
  work: number
  rt: number
  ai: number
}

export function scores(r: ResolvedBuild): Scores {
  const { cpu, gpu, ram } = r
  const g = gpu?.gaming ?? (cpu?.igpu ? IGPU_SCORE : 0)
  const c = cpu?.gaming ?? 0
  // harmonic-style blend: the weaker part drags the score down
  const gaming = g && c ? Math.round(100 * (2 / (100 / g + 100 / c)) * 0.95) : 0
  const work = cpu ? Math.round(Math.min(100, cpu.multi * 0.8 + (ram ? Math.min(ram.capacityGB, 64) / 64 : 0) * 12 + (gpu ? gpu.gaming * 0.08 : 0))) : 0
  const rt = gpu ? gpu.rt : 0
  const ai = gpu ? Math.round(Math.min(100, (gpu.vramGB / 32) * 60 + gpu.gaming * 0.3 + (gpu.maker === 'NVIDIA' ? 10 : 0))) : 0
  return { gaming: Math.min(100, gaming), work, rt, ai }
}

export function fpsColor(fps: number): string {
  if (fps >= 144) return 'text-emerald-300'
  if (fps >= 90) return 'text-teal-300'
  if (fps >= 60) return 'text-lime-300'
  if (fps >= 40) return 'text-amber-300'
  return 'text-rose-400'
}
