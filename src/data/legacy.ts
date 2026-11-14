import type { CPU, GPU } from './types'

/**
 * Previous-generation CPUs and GPUs. They are not sold as new parts in the picker,
 * but are recognised when importing a PC from the web and can be selected as
 * "parts I already own" in the build assistant.
 * Indices use the same scale as the main catalog (rounded relative values).
 */
type G = [id: string, chip: string, maker: GPU['maker'], vram: number, tdp: number, len: number, gaming: number, rt: number, price: number]
const gpuRows: G[] = [
  ['rtx4090', 'GeForce RTX 4090', 'NVIDIA', 24, 450, 336, 78, 78, 1900],
  ['rtx4080s', 'GeForce RTX 4080 Super', 'NVIDIA', 16, 320, 310, 67, 63, 1050],
  ['rtx4080', 'GeForce RTX 4080', 'NVIDIA', 16, 320, 310, 65, 61, 1000],
  ['rtx4070tis', 'GeForce RTX 4070 Ti Super', 'NVIDIA', 16, 285, 300, 59, 55, 800],
  ['rtx4070ti', 'GeForce RTX 4070 Ti', 'NVIDIA', 12, 285, 300, 55, 52, 750],
  ['rtx4070s', 'GeForce RTX 4070 Super', 'NVIDIA', 12, 220, 267, 51, 48, 600],
  ['rtx4070', 'GeForce RTX 4070', 'NVIDIA', 12, 200, 244, 45, 42, 520],
  ['rtx4060ti', 'GeForce RTX 4060 Ti', 'NVIDIA', 8, 160, 240, 33, 31, 400],
  ['rtx4060', 'GeForce RTX 4060', 'NVIDIA', 8, 115, 200, 27, 25, 300],
  ['rtx3090', 'GeForce RTX 3090', 'NVIDIA', 24, 350, 313, 46, 40, 700],
  ['rtx3080', 'GeForce RTX 3080', 'NVIDIA', 10, 320, 285, 42, 36, 450],
  ['rtx3070', 'GeForce RTX 3070', 'NVIDIA', 8, 220, 242, 33, 28, 300],
  ['rtx3060ti', 'GeForce RTX 3060 Ti', 'NVIDIA', 8, 200, 242, 30, 25, 260],
  ['rtx3060', 'GeForce RTX 3060', 'NVIDIA', 12, 170, 242, 23, 19, 250],
  ['rtx3050', 'GeForce RTX 3050', 'NVIDIA', 8, 130, 200, 16, 13, 200],
  ['gtx1660s', 'GeForce GTX 1660 Super', 'NVIDIA', 6, 125, 230, 14, 0, 150],
  ['gtx1650', 'GeForce GTX 1650', 'NVIDIA', 4, 75, 180, 9, 0, 140],
  ['rx7900xtx', 'Radeon RX 7900 XTX', 'AMD', 24, 355, 287, 66, 48, 900],
  ['rx7900xt', 'Radeon RX 7900 XT', 'AMD', 20, 315, 276, 58, 42, 700],
  ['rx7900gre', 'Radeon RX 7900 GRE', 'AMD', 16, 260, 276, 50, 35, 550],
  ['rx7800xt', 'Radeon RX 7800 XT', 'AMD', 16, 263, 267, 46, 32, 480],
  ['rx7700xt', 'Radeon RX 7700 XT', 'AMD', 12, 245, 267, 39, 27, 400],
  ['rx7600', 'Radeon RX 7600', 'AMD', 8, 165, 204, 26, 18, 270],
  ['rx6800xt', 'Radeon RX 6800 XT', 'AMD', 16, 300, 267, 42, 26, 450],
  ['rx6700xt', 'Radeon RX 6700 XT', 'AMD', 12, 230, 267, 31, 19, 300],
  ['rx6600', 'Radeon RX 6600', 'AMD', 8, 132, 190, 22, 13, 200],
  ['arca770', 'Arc A770', 'Intel', 16, 225, 270, 25, 21, 280],
  ['arca750', 'Arc A750', 'Intel', 8, 225, 270, 23, 19, 220],
]

type C = [id: string, name: string, brand: 'AMD' | 'Intel', socket: CPU['socket'], cores: number, threads: number, boost: number, maxPower: number, l3: number, igpu: boolean, gaming: number, multi: number, price: number]
const cpuRows: C[] = [
  ['r9-7950x3d', 'Ryzen 9 7950X3D', 'AMD', 'AM5', 16, 32, 5.7, 162, 128, true, 92, 88, 520],
  ['r9-7950x', 'Ryzen 9 7950X', 'AMD', 'AM5', 16, 32, 5.7, 230, 64, true, 82, 92, 470],
  ['r9-7900x', 'Ryzen 9 7900X', 'AMD', 'AM5', 12, 24, 5.6, 230, 64, true, 80, 72, 330],
  ['r7-7700x', 'Ryzen 7 7700X', 'AMD', 'AM5', 8, 16, 5.4, 142, 32, true, 79, 48, 260],
  ['r7-7700', 'Ryzen 7 7700', 'AMD', 'AM5', 8, 16, 5.3, 88, 32, true, 77, 46, 240],
  ['r5-7600x', 'Ryzen 5 7600X', 'AMD', 'AM5', 6, 12, 5.3, 142, 32, true, 72, 36, 185],
  ['r5-7500f', 'Ryzen 5 7500F', 'AMD', 'AM5', 6, 12, 5.0, 88, 32, false, 69, 33, 150],
  ['r9-5950x', 'Ryzen 9 5950X', 'AMD', 'AM4', 16, 32, 4.9, 142, 64, false, 62, 65, 330],
  ['r9-5900x', 'Ryzen 9 5900X', 'AMD', 'AM4', 12, 24, 4.8, 142, 64, false, 61, 52, 250],
  ['r7-5800x3d', 'Ryzen 7 5800X3D', 'AMD', 'AM4', 8, 16, 4.5, 142, 96, false, 72, 33, 300],
  ['r7-5800x', 'Ryzen 7 5800X', 'AMD', 'AM4', 8, 16, 4.7, 142, 32, false, 60, 36, 170],
  ['r7-5700x', 'Ryzen 7 5700X', 'AMD', 'AM4', 8, 16, 4.6, 76, 32, false, 58, 34, 140],
  ['r5-5600x', 'Ryzen 5 5600X', 'AMD', 'AM4', 6, 12, 4.6, 76, 32, false, 56, 26, 120],
  ['r5-5500', 'Ryzen 5 5500', 'AMD', 'AM4', 6, 12, 4.2, 76, 16, false, 48, 23, 80],
  ['i9-14900k', 'Core i9-14900K', 'Intel', 'LGA1700', 24, 32, 6.0, 253, 36, true, 85, 95, 480],
  ['i9-13900k', 'Core i9-13900K', 'Intel', 'LGA1700', 24, 32, 5.8, 253, 36, true, 84, 90, 430],
  ['i7-13700k', 'Core i7-13700K', 'Intel', 'LGA1700', 16, 24, 5.4, 253, 30, true, 81, 75, 330],
  ['i7-14700f', 'Core i7-14700F', 'Intel', 'LGA1700', 20, 28, 5.4, 219, 33, false, 80, 76, 320],
  ['i7-12700k', 'Core i7-12700K', 'Intel', 'LGA1700', 12, 20, 5.0, 190, 25, true, 72, 58, 230],
  ['i7-12700f', 'Core i7-12700F', 'Intel', 'LGA1700', 12, 20, 4.9, 180, 25, false, 70, 56, 220],
  ['i5-13600k', 'Core i5-13600K', 'Intel', 'LGA1700', 14, 20, 5.1, 181, 24, true, 77, 60, 230],
  ['i5-12600k', 'Core i5-12600K', 'Intel', 'LGA1700', 10, 16, 4.9, 150, 20, true, 68, 46, 170],
  ['i5-13400f', 'Core i5-13400F', 'Intel', 'LGA1700', 10, 16, 4.6, 148, 20, false, 64, 37, 150],
  ['i5-12400', 'Core i5-12400', 'Intel', 'LGA1700', 6, 12, 4.4, 117, 18, true, 58, 28, 130],
  ['i3-13100f', 'Core i3-13100F', 'Intel', 'LGA1700', 4, 8, 4.5, 89, 12, false, 54, 21, 95],
  ['i3-12100f', 'Core i3-12100F', 'Intel', 'LGA1700', 4, 8, 4.3, 89, 12, false, 52, 20, 85],
  ['cu9-285', 'Core Ultra 9 285', 'Intel', 'LGA1851', 24, 24, 5.6, 182, 36, true, 80, 90, 480],
  ['cu7-265f', 'Core Ultra 7 265F', 'Intel', 'LGA1851', 20, 20, 5.3, 182, 30, false, 78, 80, 250],
]

export const LEGACY_GPUS: GPU[] = gpuRows.map(([id, chip, maker, vramGB, tdp, lengthMm, gaming, rt, price]) => ({
  id: 'lg-' + id, category: 'gpu', brand: maker, chip, name: chip, maker, price, tier: gaming > 55 ? 'high' : gaming > 30 ? 'mid' : 'budget', legacy: true,
  vramGB, vramType: maker === 'NVIDIA' && chip.includes('40') ? 'GDDR6X' : 'GDDR6', tdp, lengthMm, slots: 2.5,
  recommendedPsu: tdp > 400 ? 1000 : tdp > 300 ? 850 : tdp > 220 ? 750 : tdp > 150 ? 650 : 550,
  power: tdp > 280 && maker === 'NVIDIA' && chip.includes('40') ? '12V-2x6' : tdp > 200 ? '2x8-pin' : '1x8-pin', gaming, rt,
  upscaler: maker === 'NVIDIA' ? (gaming > 20 && rt > 0 ? 'DLSS' : 'FSR') : maker === 'AMD' ? 'FSR 3' : 'XeSS', rgb: false,
}))

export const LEGACY_CPUS: CPU[] = cpuRows.map(([id, name, brand, socket, cores, threads, boostGHz, maxPower, l3MB, igpu, gaming, multi, price]) => ({
  id: 'lg-' + id, category: 'cpu', brand, name, price, tier: gaming > 80 ? 'high' : gaming > 65 ? 'mid' : 'budget', legacy: true,
  socket, cores, threads, baseGHz: +(boostGHz * 0.72).toFixed(1), boostGHz, tdp: Math.min(maxPower, 170), maxPower, l3MB, igpu,
  memTypes: socket === 'AM4' ? ['DDR4'] : socket === 'LGA1700' ? ['DDR5', 'DDR4'] : ['DDR5'],
  boxedCooler: /5500|5600x|5700x$|12400|13400|12100|13100/i.test(name) && !/x3d/i.test(name), gaming, multi,
}))
