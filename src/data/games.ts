export type Resolution = '1080p' | '1440p' | '4k'

export interface Game {
  id: string
  name: string
  genre: 'esports' | 'aaa' | 'sim' | 'rpg'
  /** approx. FPS of an RTX 5090 at 4K, high/ultra preset, no RT, no upscaling */
  gpuFps4k: number
  /** approx. FPS ceiling of a Ryzen 7 9800X3D (CPU-bound) */
  cpuFps: number
  /** VRAM the game wants at high settings, GB */
  vram: Record<Resolution, number>
}

/**
 * Model inputs are rough, rounded figures derived from public review averages.
 * The FPS calculator is an ESTIMATE meant to compare builds, not a benchmark.
 */
export const GAMES: Game[] = [
  { id: 'cyberpunk', name: 'Cyberpunk 2077', genre: 'aaa', gpuFps4k: 95, cpuFps: 220, vram: { '1080p': 8, '1440p': 10, '4k': 12 } },
  { id: 'alanwake2', name: 'Alan Wake 2', genre: 'aaa', gpuFps4k: 72, cpuFps: 200, vram: { '1080p': 8, '1440p': 10, '4k': 14 } },
  { id: 'wukong', name: 'Black Myth: Wukong', genre: 'aaa', gpuFps4k: 80, cpuFps: 190, vram: { '1080p': 8, '1440p': 10, '4k': 12 } },
  { id: 'bg3', name: "Baldur's Gate 3", genre: 'rpg', gpuFps4k: 120, cpuFps: 165, vram: { '1080p': 6, '1440p': 8, '4k': 10 } },
  { id: 'fh5', name: 'Forza Horizon 5', genre: 'aaa', gpuFps4k: 150, cpuFps: 260, vram: { '1080p': 6, '1440p': 8, '4k': 12 } },
  { id: 'rivals', name: 'Marvel Rivals', genre: 'esports', gpuFps4k: 100, cpuFps: 230, vram: { '1080p': 6, '1440p': 8, '4k': 10 } },
  { id: 'fortnite', name: 'Fortnite (DX12, High)', genre: 'esports', gpuFps4k: 150, cpuFps: 320, vram: { '1080p': 6, '1440p': 8, '4k': 10 } },
  { id: 'cs2', name: 'Counter-Strike 2', genre: 'esports', gpuFps4k: 350, cpuFps: 620, vram: { '1080p': 4, '1440p': 6, '4k': 8 } },
  { id: 'valorant', name: 'Valorant', genre: 'esports', gpuFps4k: 600, cpuFps: 900, vram: { '1080p': 2, '1440p': 3, '4k': 4 } },
  { id: 'msfs2024', name: 'Microsoft Flight Simulator 2024', genre: 'sim', gpuFps4k: 70, cpuFps: 85, vram: { '1080p': 8, '1440p': 10, '4k': 14 } },
]

export const RES_FACTOR: Record<Resolution, number> = { '1080p': 2.35, '1440p': 1.7, '4k': 1 }
