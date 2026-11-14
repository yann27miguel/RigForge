import { genericPart } from './generic'
import { LEGACY_CPUS, LEGACY_GPUS } from './legacy'
import type { Case, Category, Cooler, CPU, Fans, GPU, Motherboard, Part, PartOf, PSU, RAM, Storage } from './types'

/**
 * Reference prices are estimates for the German / EU market (EUR, incl. VAT).
 * They were calibrated against public price reports (PCGH, Geizhals, mydealz, 3DCenter)
 * during the 2025–26 memory shortage. Prices move daily: the app always links to live
 * price-comparison sites so users can check the real price before buying.
 */
export const PRICE_DATE = '2026-11'

const cpus: CPU[] = [
  { id: 'r7-9850x3d', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 9850X3D', price: 489, tier: 'enthusiast', socket: 'AM5', cores: 8, threads: 16, baseGHz: 4.7, boostGHz: 5.6, tdp: 120, maxPower: 162, l3MB: 96, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 103, multi: 52 },
  { id: 'r7-9800x3d', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 9800X3D', price: 449, tier: 'enthusiast', socket: 'AM5', cores: 8, threads: 16, baseGHz: 4.7, boostGHz: 5.2, tdp: 120, maxPower: 162, l3MB: 96, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 100, multi: 50 },
  { id: 'r9-9950x3d', category: 'cpu', brand: 'AMD', name: 'Ryzen 9 9950X3D', price: 659, tier: 'enthusiast', socket: 'AM5', cores: 16, threads: 32, baseGHz: 4.3, boostGHz: 5.7, tdp: 170, maxPower: 230, l3MB: 128, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 100, multi: 100 },
  { id: 'r9-9950x', category: 'cpu', brand: 'AMD', name: 'Ryzen 9 9950X', price: 529, tier: 'enthusiast', socket: 'AM5', cores: 16, threads: 32, baseGHz: 4.3, boostGHz: 5.7, tdp: 170, maxPower: 230, l3MB: 64, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 83, multi: 100 },
  { id: 'r7-7800x3d', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 7800X3D', price: 349, tier: 'high', socket: 'AM5', cores: 8, threads: 16, baseGHz: 4.2, boostGHz: 5.0, tdp: 120, maxPower: 110, l3MB: 96, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 90, multi: 43 },
  { id: 'r7-9700x', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 9700X', price: 289, tier: 'high', socket: 'AM5', cores: 8, threads: 16, baseGHz: 3.8, boostGHz: 5.5, tdp: 65, maxPower: 120, l3MB: 32, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 80, multi: 50 },
  { id: 'r5-9600x', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 9600X', price: 199, tier: 'mid', socket: 'AM5', cores: 6, threads: 12, baseGHz: 3.9, boostGHz: 5.4, tdp: 65, maxPower: 88, l3MB: 32, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 77, multi: 38 },
  { id: 'r5-7600', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 7600', price: 169, tier: 'mid', socket: 'AM5', cores: 6, threads: 12, baseGHz: 3.8, boostGHz: 5.1, tdp: 65, maxPower: 88, l3MB: 32, igpu: true, memTypes: ['DDR5'], boxedCooler: true, gaming: 70, multi: 32 },
  { id: 'r7-5700x3d', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 5700X3D', price: 229, tier: 'mid', socket: 'AM4', cores: 8, threads: 16, baseGHz: 3.0, boostGHz: 4.1, tdp: 105, maxPower: 105, l3MB: 96, igpu: false, memTypes: ['DDR4'], boxedCooler: false, gaming: 70, multi: 33 },
  { id: 'r5-5600', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 5600', price: 95, tier: 'budget', socket: 'AM4', cores: 6, threads: 12, baseGHz: 3.5, boostGHz: 4.4, tdp: 65, maxPower: 76, l3MB: 32, igpu: false, memTypes: ['DDR4'], boxedCooler: true, gaming: 55, multi: 24 },
  { id: 'cu9-285k', category: 'cpu', brand: 'Intel', name: 'Core Ultra 9 285K', price: 549, tier: 'enthusiast', socket: 'LGA1851', cores: 24, threads: 24, baseGHz: 3.7, boostGHz: 5.7, tdp: 125, maxPower: 250, l3MB: 36, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 82, multi: 98 },
  { id: 'cu7-265k', category: 'cpu', brand: 'Intel', name: 'Core Ultra 7 265K', price: 279, tier: 'high', socket: 'LGA1851', cores: 20, threads: 20, baseGHz: 3.9, boostGHz: 5.5, tdp: 125, maxPower: 250, l3MB: 30, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 80, multi: 85 },
  { id: 'cu5-245k', category: 'cpu', brand: 'Intel', name: 'Core Ultra 5 245K', price: 219, tier: 'mid', socket: 'LGA1851', cores: 14, threads: 14, baseGHz: 4.2, boostGHz: 5.2, tdp: 125, maxPower: 159, l3MB: 24, igpu: true, memTypes: ['DDR5'], boxedCooler: false, gaming: 74, multi: 60 },
  { id: 'i7-14700k', category: 'cpu', brand: 'Intel', name: 'Core i7-14700K', price: 349, tier: 'high', socket: 'LGA1700', cores: 20, threads: 28, baseGHz: 3.4, boostGHz: 5.6, tdp: 125, maxPower: 253, l3MB: 33, igpu: true, memTypes: ['DDR5', 'DDR4'], boxedCooler: false, gaming: 82, multi: 80 },
  { id: 'i5-14600k', category: 'cpu', brand: 'Intel', name: 'Core i5-14600K', price: 239, tier: 'mid', socket: 'LGA1700', cores: 14, threads: 20, baseGHz: 3.5, boostGHz: 5.3, tdp: 125, maxPower: 181, l3MB: 24, igpu: true, memTypes: ['DDR5', 'DDR4'], boxedCooler: false, gaming: 78, multi: 60 },
  { id: 'i5-14400f', category: 'cpu', brand: 'Intel', name: 'Core i5-14400F', price: 139, tier: 'budget', socket: 'LGA1700', cores: 10, threads: 16, baseGHz: 2.5, boostGHz: 4.7, tdp: 65, maxPower: 148, l3MB: 20, igpu: false, memTypes: ['DDR5', 'DDR4'], boxedCooler: true, gaming: 68, multi: 40 },
  { id: 'i5-12400f', category: 'cpu', brand: 'Intel', name: 'Core i5-12400F', price: 99, tier: 'budget', socket: 'LGA1700', cores: 6, threads: 12, baseGHz: 2.5, boostGHz: 4.4, tdp: 65, maxPower: 117, l3MB: 18, igpu: false, memTypes: ['DDR5', 'DDR4'], boxedCooler: true, gaming: 58, multi: 28 },
]

const allSockets: CPU['socket'][] = ['AM5', 'AM4', 'LGA1700', 'LGA1851']

const coolers: Cooler[] = [
  { id: 'tr-pa120se', category: 'cooler', brand: 'Thermalright', name: 'Peerless Assassin 120 SE', price: 39, tier: 'budget', type: 'air', heightMm: 155, sockets: allSockets, tdpRating: 245, noiseDb: 26, rgb: false, color: 'black' },
  { id: 'tr-ps120evo', category: 'cooler', brand: 'Thermalright', name: 'Phantom Spirit 120 EVO', price: 55, tier: 'mid', type: 'air', heightMm: 157, sockets: allSockets, tdpRating: 265, noiseDb: 25, rgb: false, color: 'black' },
  { id: 'noctua-d15g2', category: 'cooler', brand: 'Noctua', name: 'NH-D15 G2', price: 149, tier: 'high', type: 'air', heightMm: 168, sockets: allSockets, tdpRating: 280, noiseDb: 22, rgb: false },
  { id: 'noctua-l12s', category: 'cooler', brand: 'Noctua', name: 'NH-L12S (low profile)', price: 59, tier: 'mid', type: 'air', heightMm: 70, sockets: allSockets, tdpRating: 110, noiseDb: 23, rgb: false },
  { id: 'arctic-lf3-240', category: 'cooler', brand: 'Arctic', name: 'Liquid Freezer III Pro 240', price: 79, tier: 'mid', type: 'aio', radiatorMm: 240, sockets: allSockets, tdpRating: 270, noiseDb: 26, rgb: false, color: 'black' },
  { id: 'arctic-lf3-360', category: 'cooler', brand: 'Arctic', name: 'Liquid Freezer III Pro 360', price: 99, tier: 'high', type: 'aio', radiatorMm: 360, sockets: allSockets, tdpRating: 330, noiseDb: 25, rgb: false, color: 'black' },
  { id: 'nzxt-kraken-elite-360', category: 'cooler', brand: 'NZXT', name: 'Kraken Elite 360 RGB (LCD)', price: 279, tier: 'enthusiast', type: 'aio', radiatorMm: 360, sockets: allSockets, tdpRating: 320, noiseDb: 27, rgb: true, lcd: true, color: 'white' },
  { id: 'lianli-galahad2-360', category: 'cooler', brand: 'Lian Li', name: 'Galahad II Trinity 360 RGB', price: 149, tier: 'high', type: 'aio', radiatorMm: 360, sockets: allSockets, tdpRating: 320, noiseDb: 28, rgb: true, color: 'black' },
]

const motherboards: Motherboard[] = [
  { id: 'asus-x870e-e', category: 'motherboard', brand: 'ASUS', name: 'ROG STRIX X870E-E GAMING WIFI', price: 499, tier: 'enthusiast', socket: 'AM5', chipset: 'X870E', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 256, m2Slots: 5, sataPorts: 4, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'excellent' },
  { id: 'msi-x870-tomahawk', category: 'motherboard', brand: 'MSI', name: 'MAG X870 TOMAHAWK WIFI', price: 299, tier: 'high', socket: 'AM5', chipset: 'X870', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 256, m2Slots: 4, sataPorts: 4, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'excellent' },
  { id: 'asus-b850-a', category: 'motherboard', brand: 'ASUS', name: 'ROG STRIX B850-A GAMING WIFI (white)', price: 269, tier: 'high', socket: 'AM5', chipset: 'B850', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 256, m2Slots: 3, sataPorts: 2, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'good', color: 'white' },
  { id: 'msi-b850-tomahawk', category: 'motherboard', brand: 'MSI', name: 'MAG B850 TOMAHAWK MAX WIFI', price: 229, tier: 'mid', socket: 'AM5', chipset: 'B850', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 256, m2Slots: 3, sataPorts: 4, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'good' },
  { id: 'asus-tuf-b650-plus', category: 'motherboard', brand: 'ASUS', name: 'TUF GAMING B650-PLUS WIFI', price: 179, tier: 'mid', socket: 'AM5', chipset: 'B650', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 192, m2Slots: 3, sataPorts: 4, wifi: 'Wi-Fi 6', pcieGpu: 4, vrm: 'good' },
  { id: 'msi-b650m-gaming-plus', category: 'motherboard', brand: 'MSI', name: 'B650M GAMING PLUS WIFI', price: 149, tier: 'budget', socket: 'AM5', chipset: 'B650', formFactor: 'mATX', memType: 'DDR5', memSlots: 4, maxMemGB: 192, m2Slots: 2, sataPorts: 4, wifi: 'Wi-Fi 6E', pcieGpu: 4, vrm: 'good' },
  { id: 'gb-b650m-ds3h', category: 'motherboard', brand: 'Gigabyte', name: 'B650M DS3H', price: 119, tier: 'budget', socket: 'AM5', chipset: 'B650', formFactor: 'mATX', memType: 'DDR5', memSlots: 4, maxMemGB: 192, m2Slots: 2, sataPorts: 4, wifi: null, pcieGpu: 4, vrm: 'basic' },
  { id: 'asrock-b850i', category: 'motherboard', brand: 'ASRock', name: 'B850I Lightning WiFi', price: 219, tier: 'mid', socket: 'AM5', chipset: 'B850', formFactor: 'ITX', memType: 'DDR5', memSlots: 2, maxMemGB: 128, m2Slots: 2, sataPorts: 2, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'good' },
  { id: 'msi-b550-tomahawk', category: 'motherboard', brand: 'MSI', name: 'MAG B550 TOMAHAWK', price: 139, tier: 'budget', socket: 'AM4', chipset: 'B550', formFactor: 'ATX', memType: 'DDR4', memSlots: 4, maxMemGB: 128, m2Slots: 2, sataPorts: 6, wifi: null, pcieGpu: 4, vrm: 'good' },
  { id: 'asrock-b550m-pro4', category: 'motherboard', brand: 'ASRock', name: 'B550M Pro4', price: 99, tier: 'budget', socket: 'AM4', chipset: 'B550', formFactor: 'mATX', memType: 'DDR4', memSlots: 4, maxMemGB: 128, m2Slots: 2, sataPorts: 6, wifi: null, pcieGpu: 4, vrm: 'basic' },
  { id: 'asus-z890-a', category: 'motherboard', brand: 'ASUS', name: 'ROG STRIX Z890-A GAMING WIFI (white)', price: 399, tier: 'enthusiast', socket: 'LGA1851', chipset: 'Z890', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 256, m2Slots: 5, sataPorts: 4, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'excellent', color: 'white' },
  { id: 'msi-b860-tomahawk', category: 'motherboard', brand: 'MSI', name: 'MAG B860 TOMAHAWK WIFI', price: 199, tier: 'mid', socket: 'LGA1851', chipset: 'B860', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 256, m2Slots: 3, sataPorts: 4, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'good' },
  { id: 'asus-z790-f', category: 'motherboard', brand: 'ASUS', name: 'ROG STRIX Z790-F GAMING WIFI II', price: 349, tier: 'high', socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, maxMemGB: 192, m2Slots: 5, sataPorts: 4, wifi: 'Wi-Fi 7', pcieGpu: 5, vrm: 'excellent' },
  { id: 'gb-b760m-aorus-elite', category: 'motherboard', brand: 'Gigabyte', name: 'B760M AORUS ELITE AX', price: 159, tier: 'mid', socket: 'LGA1700', chipset: 'B760', formFactor: 'mATX', memType: 'DDR5', memSlots: 4, maxMemGB: 192, m2Slots: 2, sataPorts: 4, wifi: 'Wi-Fi 6E', pcieGpu: 4, vrm: 'good' },
  { id: 'msi-b760-p-ddr4', category: 'motherboard', brand: 'MSI', name: 'PRO B760-P WIFI DDR4', price: 129, tier: 'budget', socket: 'LGA1700', chipset: 'B760', formFactor: 'ATX', memType: 'DDR4', memSlots: 4, maxMemGB: 128, m2Slots: 2, sataPorts: 4, wifi: 'Wi-Fi 6E', pcieGpu: 4, vrm: 'basic' },
]

const rams: RAM[] = [
  { id: 'kingston-beast-ddr5-6000-32', category: 'ram', brand: 'Kingston', name: 'FURY Beast DDR5-6000 CL30 32GB (2×16GB)', price: 439, tier: 'mid', memType: 'DDR5', capacityGB: 32, modules: 2, speed: 6000, cas: 30, rgb: false, color: 'black' },
  { id: 'patriot-venom-ddr5-6000-32', category: 'ram', brand: 'Patriot', name: 'Viper Venom DDR5-6000 CL30 32GB (2×16GB)', price: 409, tier: 'mid', memType: 'DDR5', capacityGB: 32, modules: 2, speed: 6000, cas: 30, rgb: false, color: 'black' },
  { id: 'corsair-vengeance-rgb-ddr5-6000-32', category: 'ram', brand: 'Corsair', name: 'Vengeance RGB DDR5-6000 CL30 32GB (2×16GB)', price: 459, tier: 'high', memType: 'DDR5', capacityGB: 32, modules: 2, speed: 6000, cas: 30, rgb: true, color: 'black' },
  { id: 'teamgroup-delta-white-ddr5-6000-32', category: 'ram', brand: 'TeamGroup', name: 'T-Force Delta RGB White DDR5-6000 CL30 32GB', price: 449, tier: 'high', memType: 'DDR5', capacityGB: 32, modules: 2, speed: 6000, cas: 30, rgb: true, color: 'white' },
  { id: 'gskill-z5neo-ddr5-6000-64', category: 'ram', brand: 'G.Skill', name: 'Trident Z5 Neo RGB DDR5-6000 CL30 64GB (2×32GB)', price: 869, tier: 'enthusiast', memType: 'DDR5', capacityGB: 64, modules: 2, speed: 6000, cas: 30, rgb: true, color: 'black' },
  { id: 'kingston-beast-ddr5-5600-16', category: 'ram', brand: 'Kingston', name: 'FURY Beast DDR5-5600 CL36 16GB (2×8GB)', price: 229, tier: 'budget', memType: 'DDR5', capacityGB: 16, modules: 2, speed: 5600, cas: 36, rgb: false, color: 'black' },
  { id: 'corsair-lpx-ddr4-3200-32', category: 'ram', brand: 'Corsair', name: 'Vengeance LPX DDR4-3200 CL16 32GB (2×16GB)', price: 179, tier: 'budget', memType: 'DDR4', capacityGB: 32, modules: 2, speed: 3200, cas: 16, rgb: false, color: 'black' },
  { id: 'kingston-beast-ddr4-3600-16', category: 'ram', brand: 'Kingston', name: 'FURY Beast DDR4-3600 CL18 16GB (2×8GB)', price: 99, tier: 'budget', memType: 'DDR4', capacityGB: 16, modules: 2, speed: 3600, cas: 18, rgb: false, color: 'black' },
]

const gpus: GPU[] = [
  { id: 'rtx5090', category: 'gpu', brand: 'MSI', chip: 'GeForce RTX 5090', name: 'GeForce RTX 5090 Gaming Trio OC', maker: 'NVIDIA', price: 3299, tier: 'enthusiast', vramGB: 32, vramType: 'GDDR7', tdp: 575, lengthMm: 359, slots: 3.5, recommendedPsu: 1000, power: '12V-2x6', gaming: 100, rt: 100, upscaler: 'DLSS 4', rgb: true },
  { id: 'rtx5080', category: 'gpu', brand: 'ASUS', chip: 'GeForce RTX 5080', name: 'Prime GeForce RTX 5080 OC', maker: 'NVIDIA', price: 1249, tier: 'enthusiast', vramGB: 16, vramType: 'GDDR7', tdp: 360, lengthMm: 304, slots: 2.5, recommendedPsu: 850, power: '12V-2x6', gaming: 74, rt: 72, upscaler: 'DLSS 4', rgb: false },
  { id: 'rtx5070ti', category: 'gpu', brand: 'MSI', chip: 'GeForce RTX 5070 Ti', name: 'GeForce RTX 5070 Ti Ventus 3X OC', maker: 'NVIDIA', price: 899, tier: 'high', vramGB: 16, vramType: 'GDDR7', tdp: 300, lengthMm: 303, slots: 2.5, recommendedPsu: 750, power: '12V-2x6', gaming: 65, rt: 62, upscaler: 'DLSS 4', rgb: false },
  { id: 'rx9070xt', category: 'gpu', brand: 'Sapphire', chip: 'Radeon RX 9070 XT', name: 'Pulse Radeon RX 9070 XT 16GB', maker: 'AMD', price: 719, tier: 'high', vramGB: 16, vramType: 'GDDR6', tdp: 304, lengthMm: 314, slots: 2.5, recommendedPsu: 750, power: '2x8-pin', gaming: 63, rt: 52, upscaler: 'FSR 4', rgb: false },
  { id: 'rx9070xt-white', category: 'gpu', brand: 'ASUS', chip: 'Radeon RX 9070 XT', name: 'Prime Radeon RX 9070 XT OC White', maker: 'AMD', price: 739, tier: 'high', vramGB: 16, vramType: 'GDDR6', tdp: 304, lengthMm: 313, slots: 2.5, recommendedPsu: 750, power: '2x8-pin', gaming: 63, rt: 52, upscaler: 'FSR 4', rgb: false, color: 'white' },
  { id: 'rx9070', category: 'gpu', brand: 'PowerColor', chip: 'Radeon RX 9070', name: 'Hellhound Radeon RX 9070 16GB', maker: 'AMD', price: 619, tier: 'high', vramGB: 16, vramType: 'GDDR6', tdp: 220, lengthMm: 330, slots: 2.5, recommendedPsu: 650, power: '2x8-pin', gaming: 56, rt: 46, upscaler: 'FSR 4', rgb: true },
  { id: 'rtx5070', category: 'gpu', brand: 'Gigabyte', chip: 'GeForce RTX 5070', name: 'GeForce RTX 5070 Windforce OC SFF 12G', maker: 'NVIDIA', price: 619, tier: 'mid', vramGB: 12, vramType: 'GDDR7', tdp: 250, lengthMm: 261, slots: 2.5, recommendedPsu: 650, power: '12V-2x6', gaming: 52, rt: 49, upscaler: 'DLSS 4', rgb: false },
  { id: 'rx9070gre', category: 'gpu', brand: 'XFX', chip: 'Radeon RX 9070 GRE', name: 'Swift Radeon RX 9070 GRE 12GB', maker: 'AMD', price: 519, tier: 'mid', vramGB: 12, vramType: 'GDDR6', tdp: 220, lengthMm: 300, slots: 2.5, recommendedPsu: 650, power: '2x8-pin', gaming: 47, rt: 38, upscaler: 'FSR 4', rgb: false },
  { id: 'rtx5060ti16', category: 'gpu', brand: 'ASUS', chip: 'GeForce RTX 5060 Ti 16GB', name: 'Dual GeForce RTX 5060 Ti 16GB', maker: 'NVIDIA', price: 469, tier: 'mid', vramGB: 16, vramType: 'GDDR7', tdp: 180, lengthMm: 229, slots: 2.5, recommendedPsu: 600, power: '1x8-pin', gaming: 39, rt: 36, upscaler: 'DLSS 4', rgb: false },
  { id: 'rx9060xt16', category: 'gpu', brand: 'Sapphire', chip: 'Radeon RX 9060 XT 16GB', name: 'Pulse Radeon RX 9060 XT 16GB', maker: 'AMD', price: 379, tier: 'mid', vramGB: 16, vramType: 'GDDR6', tdp: 160, lengthMm: 240, slots: 2, recommendedPsu: 550, power: '1x8-pin', gaming: 38, rt: 30, upscaler: 'FSR 4', rgb: false },
  { id: 'rtx5060', category: 'gpu', brand: 'MSI', chip: 'GeForce RTX 5060', name: 'GeForce RTX 5060 Ventus 2X OC 8G', maker: 'NVIDIA', price: 309, tier: 'budget', vramGB: 8, vramType: 'GDDR7', tdp: 145, lengthMm: 197, slots: 2, recommendedPsu: 550, power: '1x8-pin', gaming: 32, rt: 29, upscaler: 'DLSS 4', rgb: false },
  { id: 'arc-b580', category: 'gpu', brand: 'ASRock', chip: 'Arc B580', name: 'Challenger Arc B580 12GB OC', maker: 'Intel', price: 279, tier: 'budget', vramGB: 12, vramType: 'GDDR6', tdp: 190, lengthMm: 270, slots: 2, recommendedPsu: 600, power: '1x8-pin', gaming: 30, rt: 26, upscaler: 'XeSS 2', rgb: false },
  { id: 'rtx5050', category: 'gpu', brand: 'Gigabyte', chip: 'GeForce RTX 5050', name: 'GeForce RTX 5050 Windforce OC 8G', maker: 'NVIDIA', price: 249, tier: 'budget', vramGB: 8, vramType: 'GDDR6', tdp: 130, lengthMm: 199, slots: 2, recommendedPsu: 550, power: '1x8-pin', gaming: 25, rt: 22, upscaler: 'DLSS 4', rgb: false },
]

const storage: Storage[] = [
  { id: 'samsung-9100pro-2tb', category: 'storage', brand: 'Samsung', name: '9100 PRO 2TB', price: 299, tier: 'enthusiast', kind: 'NVMe Gen5', capacityGB: 2000, readMBs: 14700, writeMBs: 13400, formFactor: 'M.2', dram: true, tbw: 1200 },
  { id: 'samsung-990pro-2tb', category: 'storage', brand: 'Samsung', name: '990 PRO 2TB', price: 219, tier: 'high', kind: 'NVMe Gen4', capacityGB: 2000, readMBs: 7450, writeMBs: 6900, formFactor: 'M.2', dram: true, tbw: 1200 },
  { id: 'wd-sn850x-1tb', category: 'storage', brand: 'WD', name: 'WD_BLACK SN850X 1TB', price: 119, tier: 'mid', kind: 'NVMe Gen4', capacityGB: 1000, readMBs: 7300, writeMBs: 6300, formFactor: 'M.2', dram: true, tbw: 600 },
  { id: 'lexar-nm790-4tb', category: 'storage', brand: 'Lexar', name: 'NM790 4TB', price: 329, tier: 'high', kind: 'NVMe Gen4', capacityGB: 4000, readMBs: 7400, writeMBs: 6500, formFactor: 'M.2', dram: false, tbw: 3000 },
  { id: 'lexar-nm790-2tb', category: 'storage', brand: 'Lexar', name: 'NM790 2TB', price: 159, tier: 'mid', kind: 'NVMe Gen4', capacityGB: 2000, readMBs: 7400, writeMBs: 6500, formFactor: 'M.2', dram: false, tbw: 1500 },
  { id: 'kingston-nv3-1tb', category: 'storage', brand: 'Kingston', name: 'NV3 1TB', price: 79, tier: 'budget', kind: 'NVMe Gen4', capacityGB: 1000, readMBs: 6000, writeMBs: 4000, formFactor: 'M.2', dram: false, tbw: 320 },
  { id: 'samsung-870evo-1tb', category: 'storage', brand: 'Samsung', name: '870 EVO 1TB (SATA)', price: 109, tier: 'budget', kind: 'SATA SSD', capacityGB: 1000, readMBs: 560, writeMBs: 530, formFactor: '2.5"', dram: true, tbw: 600 },
  { id: 'seagate-barracuda-4tb', category: 'storage', brand: 'Seagate', name: 'BarraCuda 4TB HDD', price: 109, tier: 'budget', kind: 'HDD', capacityGB: 4000, readMBs: 190, writeMBs: 190, formFactor: '3.5"', dram: true },
]

const psus: PSU[] = [
  { id: 'msi-a650bn', category: 'psu', brand: 'MSI', name: 'MAG A650BN 650W', price: 59, tier: 'budget', wattage: 650, efficiency: '80+ Bronze', modular: 'none', formFactor: 'ATX', atx3: false, native12V2x6: false, warrantyYears: 5 },
  { id: 'bq-pp12m-650', category: 'psu', brand: 'be quiet!', name: 'Pure Power 12 M 650W', price: 89, tier: 'mid', wattage: 650, efficiency: '80+ Gold', modular: 'full', formFactor: 'ATX', atx3: true, native12V2x6: true, warrantyYears: 10 },
  { id: 'corsair-rm750e', category: 'psu', brand: 'Corsair', name: 'RM750e (ATX 3.1) 750W', price: 109, tier: 'mid', wattage: 750, efficiency: '80+ Gold', modular: 'full', formFactor: 'ATX', atx3: true, native12V2x6: true, warrantyYears: 7 },
  { id: 'bq-pp12m-850', category: 'psu', brand: 'be quiet!', name: 'Pure Power 12 M 850W', price: 119, tier: 'mid', wattage: 850, efficiency: '80+ Gold', modular: 'full', formFactor: 'ATX', atx3: true, native12V2x6: true, warrantyYears: 10 },
  { id: 'seasonic-gx1000', category: 'psu', brand: 'Seasonic', name: 'FOCUS GX-1000 ATX 3 1000W', price: 179, tier: 'high', wattage: 1000, efficiency: '80+ Gold', modular: 'full', formFactor: 'ATX', atx3: true, native12V2x6: true, warrantyYears: 10 },
  { id: 'bq-sp12-1200', category: 'psu', brand: 'be quiet!', name: 'Straight Power 12 1200W', price: 249, tier: 'enthusiast', wattage: 1200, efficiency: '80+ Platinum', modular: 'full', formFactor: 'ATX', atx3: true, native12V2x6: true, warrantyYears: 10 },
  { id: 'corsair-sf750', category: 'psu', brand: 'Corsair', name: 'SF750 (SFX) 750W', price: 169, tier: 'high', wattage: 750, efficiency: '80+ Platinum', modular: 'full', formFactor: 'SFX', atx3: true, native12V2x6: true, warrantyYears: 7 },
]

const cases: Case[] = [
  { id: 'fractal-north', category: 'case', brand: 'Fractal Design', name: 'North (Charcoal Black)', price: 139, tier: 'high', supports: ['ATX', 'mATX', 'ITX'], maxGpuMm: 355, maxCoolerMm: 170, maxRadiatorMm: 360, psuForms: ['ATX', 'SFX'], includedFans: 2, maxFans: 7, panel: 'mesh+glass', size: 'mid', dims: { d: 447, h: 469, w: 215 }, drive35: 2, rgb: false, color: 'black' },
  { id: 'fractal-north-white', category: 'case', brand: 'Fractal Design', name: 'North (Chalk White)', price: 145, tier: 'high', supports: ['ATX', 'mATX', 'ITX'], maxGpuMm: 355, maxCoolerMm: 170, maxRadiatorMm: 360, psuForms: ['ATX', 'SFX'], includedFans: 2, maxFans: 7, panel: 'mesh+glass', size: 'mid', dims: { d: 447, h: 469, w: 215 }, drive35: 2, rgb: false, color: 'white' },
  { id: 'lianli-lancool217', category: 'case', brand: 'Lian Li', name: 'Lancool 217', price: 119, tier: 'mid', supports: ['E-ATX', 'ATX', 'mATX', 'ITX'], maxGpuMm: 400, maxCoolerMm: 180, maxRadiatorMm: 360, psuForms: ['ATX', 'SFX'], includedFans: 5, maxFans: 10, panel: 'mesh+glass', size: 'mid', dims: { d: 482, h: 503, w: 238 }, drive35: 2, rgb: true, color: 'black' },
  { id: 'nzxt-h5-flow', category: 'case', brand: 'NZXT', name: 'H5 Flow (2024) White', price: 99, tier: 'mid', supports: ['ATX', 'mATX', 'ITX'], maxGpuMm: 365, maxCoolerMm: 165, maxRadiatorMm: 360, psuForms: ['ATX', 'SFX'], includedFans: 2, maxFans: 7, panel: 'mesh+glass', size: 'mid', dims: { d: 446, h: 464, w: 227 }, drive35: 1, rgb: false, color: 'white' },
  { id: 'nzxt-h9-flow', category: 'case', brand: 'NZXT', name: 'H9 Flow (2025) Dual-Chamber', price: 179, tier: 'high', supports: ['ATX', 'mATX', 'ITX'], maxGpuMm: 435, maxCoolerMm: 165, maxRadiatorMm: 360, psuForms: ['ATX'], includedFans: 4, maxFans: 10, panel: 'glass', size: 'full', dims: { d: 466, h: 510, w: 290 }, drive35: 2, rgb: false, color: 'black' },
  { id: 'lianli-o11-evo-rgb', category: 'case', brand: 'Lian Li', name: 'O11 Dynamic EVO RGB (white)', price: 169, tier: 'high', supports: ['E-ATX', 'ATX', 'mATX', 'ITX'], maxGpuMm: 426, maxCoolerMm: 167, maxRadiatorMm: 360, psuForms: ['ATX'], includedFans: 0, maxFans: 10, panel: 'glass', size: 'full', dims: { d: 465, h: 459, w: 285 }, drive35: 2, rgb: true, color: 'white' },
  { id: 'phanteks-xt-pro-ultra', category: 'case', brand: 'Phanteks', name: 'XT PRO Ultra', price: 89, tier: 'budget', supports: ['E-ATX', 'ATX', 'mATX', 'ITX'], maxGpuMm: 415, maxCoolerMm: 184, maxRadiatorMm: 360, psuForms: ['ATX'], includedFans: 4, maxFans: 10, panel: 'mesh+glass', size: 'mid', dims: { d: 450, h: 520, w: 230 }, drive35: 2, rgb: true, color: 'black' },
  { id: 'jonsbo-d31-mesh', category: 'case', brand: 'Jonsbo', name: 'D31 MESH (mATX)', price: 89, tier: 'budget', supports: ['mATX', 'ITX'], maxGpuMm: 400, maxCoolerMm: 168, maxRadiatorMm: 360, psuForms: ['ATX'], includedFans: 0, maxFans: 7, panel: 'mesh+glass', size: 'compact', dims: { d: 418, h: 444, w: 205 }, drive35: 1, rgb: false, color: 'black' },
  { id: 'cm-nr200p-v2', category: 'case', brand: 'Cooler Master', name: 'NR200P V2 (Mini-ITX)', price: 109, tier: 'mid', supports: ['ITX'], maxGpuMm: 336, maxCoolerMm: 155, maxRadiatorMm: 280, psuForms: ['SFX', 'ATX'], includedFans: 2, maxFans: 7, panel: 'glass', size: 'sff', dims: { d: 376, h: 292, w: 185 }, drive35: 1, rgb: false, color: 'black' },
  { id: 'fractal-terra', category: 'case', brand: 'Fractal Design', name: 'Terra (Mini-ITX, SFX only)', price: 179, tier: 'high', supports: ['ITX'], maxGpuMm: 322, maxCoolerMm: 77, maxRadiatorMm: 0, psuForms: ['SFX'], includedFans: 0, maxFans: 0, panel: 'mesh', size: 'sff', dims: { d: 355, h: 240, w: 157 }, drive35: 0, rgb: false, color: 'black' },
]

const fans: Fans[] = [
  { id: 'arctic-p12-5pack', category: 'fans', brand: 'Arctic', name: 'P12 PWM PST 5-pack (120mm)', price: 32, tier: 'budget', count: 5, sizeMm: 120, rgb: false, airflowCFM: 56, noiseDb: 22, color: 'black' },
  { id: 'arctic-p14-3pack', category: 'fans', brand: 'Arctic', name: 'P14 PWM PST 3-pack (140mm)', price: 29, tier: 'budget', count: 3, sizeMm: 140, rgb: false, airflowCFM: 72, noiseDb: 24, color: 'black' },
  { id: 'lianli-slinf-3pack', category: 'fans', brand: 'Lian Li', name: 'UNI FAN SL-INF 120 RGB 3-pack', price: 89, tier: 'high', count: 3, sizeMm: 120, rgb: true, airflowCFM: 61, noiseDb: 29, color: 'black' },
  { id: 'lianli-slinf-3pack-white', category: 'fans', brand: 'Lian Li', name: 'UNI FAN SL-INF 120 RGB 3-pack (white)', price: 92, tier: 'high', count: 3, sizeMm: 120, rgb: true, airflowCFM: 61, noiseDb: 29, color: 'white' },
  { id: 'noctua-a12x25g2-2pack', category: 'fans', brand: 'Noctua', name: 'NF-A12x25 G2 PWM 2-pack', price: 69, tier: 'enthusiast', count: 2, sizeMm: 120, rgb: false, airflowCFM: 60, noiseDb: 22 },
]

export const PARTS: Part[] = [...cpus, ...coolers, ...motherboards, ...rams, ...gpus, ...storage, ...psus, ...cases, ...fans]

/** previous-generation parts: recognised in imports & "owned parts", hidden from the shop list */
export const LEGACY_PARTS: Part[] = [...LEGACY_CPUS, ...LEGACY_GPUS]

const byId = new Map([...PARTS, ...LEGACY_PARTS].map((p) => [p.id, p]))

export function getPart<C extends Category>(id: string | undefined, category?: C): PartOf<C> | undefined {
  if (!id) return undefined
  const p = byId.get(id) ?? genericPart(id)
  if (!p) return undefined
  if (category && p.category !== category) return undefined
  return p as PartOf<C>
}

export function partsOf<C extends Category>(category: C, includeLegacy = false): PartOf<C>[] {
  return (includeLegacy ? [...PARTS, ...LEGACY_PARTS] : PARTS).filter((p) => p.category === category) as PartOf<C>[]
}

export function displayName(p: Part): string {
  if (p.brand === 'Generic') return p.name
  if (p.legacy && (p.category === 'gpu' || p.category === 'cpu')) return p.category === 'gpu' ? p.chip : `${p.brand} ${p.name}`
  return `${p.brand} ${p.name}`
}
