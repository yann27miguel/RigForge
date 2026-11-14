import type { Lang } from '../i18n'
import type { Build } from './types'

export interface Preset {
  id: string
  name: Record<Lang, string>
  desc: Record<Lang, string>
  useCase: 'gaming' | 'creator' | 'office' | 'ai' | 'sff'
  target: string
  accent: string
  build: Build
}

export const PRESETS: Preset[] = [
  {
    id: 'office', useCase: 'office', target: 'Office · Study · 4K video', accent: '#94a3b8',
    name: { en: 'Study & Office', de: 'Studium & Büro', fr: 'Études & bureautique' },
    desc: { en: 'Quiet, fast and cheap. Uses the Ryzen’s integrated graphics – add a GPU later for gaming.', de: 'Leise, schnell und günstig. Nutzt die integrierte Ryzen-Grafik – GPU später nachrüstbar.', fr: 'Silencieux, rapide et abordable. Utilise la partie graphique du Ryzen – GPU ajoutable plus tard.' },
    build: { cpu: 'r5-7600', motherboard: 'gb-b650m-ds3h', ram: 'kingston-beast-ddr5-5600-16', storage: ['kingston-nv3-1tb'], psu: 'msi-a650bn', case: 'jonsbo-d31-mesh', fans: 'arctic-p12-5pack' },
  },
  {
    id: 'budget-am4', useCase: 'gaming', target: '1080p High · 60–120 FPS', accent: '#22c55e',
    name: { en: 'Smart Budget (AM4)', de: 'Smart Budget (AM4)', fr: 'Budget malin (AM4)' },
    desc: { en: 'Uses affordable DDR4 to dodge the DDR5 price spike, with a 16 GB GPU that ages well.', de: 'Setzt auf günstigen DDR4 gegen die DDR5-Preisspitze, dazu eine 16-GB-GPU, die gut altert.', fr: 'Mise sur la DDR4 abordable face à la flambée de la DDR5, avec un GPU 16 Go qui vieillit bien.' },
    build: { cpu: 'r5-5600', motherboard: 'asrock-b550m-pro4', ram: 'corsair-lpx-ddr4-3200-32', gpu: 'rx9060xt16', storage: ['kingston-nv3-1tb'], psu: 'bq-pp12m-650', case: 'phanteks-xt-pro-ultra' },
  },
  {
    id: 'esports', useCase: 'gaming', target: '1080p · 240 Hz esports', accent: '#06b6d4',
    name: { en: 'Esports 1080p', de: 'E-Sport 1080p', fr: 'E-sport 1080p' },
    desc: { en: 'High-FPS build for CS2, Valorant and Fortnite on a modern AM5 platform with upgrade room.', de: 'High-FPS-Build für CS2, Valorant und Fortnite auf moderner AM5-Plattform mit Upgrade-Reserve.', fr: 'Config haut FPS pour CS2, Valorant et Fortnite sur plateforme AM5 évolutive.' },
    build: { cpu: 'r5-9600x', cooler: 'tr-pa120se', motherboard: 'msi-b650m-gaming-plus', ram: 'patriot-venom-ddr5-6000-32', gpu: 'rtx5060ti16', storage: ['kingston-nv3-1tb'], psu: 'bq-pp12m-650', case: 'jonsbo-d31-mesh', fans: 'arctic-p12-5pack' },
  },
  {
    id: 'sweet-1440', useCase: 'gaming', target: '1440p Ultra · 100+ FPS', accent: '#8b5cf6',
    name: { en: '1440p Sweet Spot', de: '1440p-Sweetspot', fr: 'Idéal 1440p' },
    desc: { en: 'The best value for most gamers: X3D gaming CPU and RX 9070 XT with 16 GB VRAM.', de: 'Das beste Preis-Leistungs-Verhältnis: X3D-Gaming-CPU und RX 9070 XT mit 16 GB VRAM.', fr: 'Le meilleur rapport qualité-prix : CPU X3D et RX 9070 XT avec 16 Go de VRAM.' },
    build: { cpu: 'r7-7800x3d', cooler: 'tr-ps120evo', motherboard: 'asus-tuf-b650-plus', ram: 'kingston-beast-ddr5-6000-32', gpu: 'rx9070xt', storage: ['lexar-nm790-2tb'], psu: 'corsair-rm750e', case: 'fractal-north' },
  },
  {
    id: 'sff', useCase: 'sff', target: '1440p · 13 L Mini-ITX', accent: '#f59e0b',
    name: { en: 'Compact Powerhouse (ITX)', de: 'Kompaktes Kraftpaket (ITX)', fr: 'Compact et puissant (ITX)' },
    desc: { en: 'Fits on a desk or under a TV. Every part was chosen to fit a 280 mm radiator and SFX power.', de: 'Passt auf den Schreibtisch oder unter den TV. Jedes Teil passt zu 280-mm-Radiator und SFX-Netzteil.', fr: 'Tient sur un bureau ou sous la TV. Chaque pièce est choisie pour un radiateur 280 mm et une alim SFX.' },
    build: { cpu: 'r7-9800x3d', cooler: 'arctic-lf3-240', motherboard: 'asrock-b850i', ram: 'kingston-beast-ddr5-6000-32', gpu: 'rtx5070', storage: ['lexar-nm790-2tb'], psu: 'corsair-sf750', case: 'cm-nr200p-v2' },
  },
  {
    id: 'white', useCase: 'gaming', target: '1440p · all-white RGB', accent: '#e2e8f0',
    name: { en: 'Snow White RGB', de: 'Schneeweiß RGB', fr: 'Blanc neige RGB' },
    desc: { en: 'Show-piece white build with an LCD AIO, white GPU and infinity-mirror RGB fans.', de: 'Weißer Showcase-Build mit LCD-AiO, weißer GPU und Infinity-Mirror-RGB-Lüftern.', fr: 'Config vitrine toute blanche avec AIO à écran LCD, GPU blanc et ventilateurs RGB miroir infini.' },
    build: { cpu: 'cu7-265k', cooler: 'nzxt-kraken-elite-360', motherboard: 'asus-z890-a', ram: 'teamgroup-delta-white-ddr5-6000-32', gpu: 'rx9070xt-white', storage: ['samsung-990pro-2tb'], psu: 'bq-pp12m-850', case: 'lianli-o11-evo-rgb', fans: 'lianli-slinf-3pack-white' },
  },
  {
    id: 'enthusiast-4k', useCase: 'gaming', target: '4K High · DLSS 4', accent: '#ef4444',
    name: { en: '4K Enthusiast', de: '4K-Enthusiast', fr: 'Passionné 4K' },
    desc: { en: 'Fastest gaming CPU with RTX 5080 for 4K at high settings and strong ray tracing.', de: 'Schnellste Gaming-CPU mit RTX 5080 für 4K auf hohen Details und starkes Raytracing.', fr: 'Le CPU gaming le plus rapide avec une RTX 5080 pour la 4K en élevé et un ray tracing solide.' },
    build: { cpu: 'r7-9850x3d', cooler: 'arctic-lf3-360', motherboard: 'msi-x870-tomahawk', ram: 'corsair-vengeance-rgb-ddr5-6000-32', gpu: 'rtx5080', storage: ['samsung-990pro-2tb'], psu: 'bq-pp12m-850', case: 'lianli-lancool217', fans: 'lianli-slinf-3pack' },
  },
  {
    id: 'creator', useCase: 'creator', target: 'Video · 3D · Code', accent: '#14b8a6',
    name: { en: 'Creator Workstation', de: 'Creator-Workstation', fr: 'Station créateur' },
    desc: { en: '16 cores, 64 GB RAM and a CUDA GPU for Premiere, DaVinci Resolve, Blender and compiling.', de: '16 Kerne, 64 GB RAM und CUDA-GPU für Premiere, DaVinci Resolve, Blender und Kompilieren.', fr: '16 cœurs, 64 Go de RAM et un GPU CUDA pour Premiere, DaVinci Resolve, Blender et la compilation.' },
    build: { cpu: 'r9-9950x', cooler: 'noctua-d15g2', motherboard: 'msi-x870-tomahawk', ram: 'gskill-z5neo-ddr5-6000-64', gpu: 'rtx5070ti', storage: ['samsung-990pro-2tb', 'seagate-barracuda-4tb'], psu: 'seasonic-gx1000', case: 'fractal-north' },
  },
  {
    id: 'ai', useCase: 'ai', target: 'Local LLMs · Stable Diffusion', accent: '#a3e635',
    name: { en: 'Local AI Starter', de: 'Lokale-KI-Einstieg', fr: 'IA locale – débutant' },
    desc: { en: 'CUDA GPU with 16 GB VRAM, 64 GB RAM and 4 TB of fast storage for models and datasets.', de: 'CUDA-GPU mit 16 GB VRAM, 64 GB RAM und 4 TB schnellem Speicher für Modelle und Datensätze.', fr: 'GPU CUDA 16 Go de VRAM, 64 Go de RAM et 4 To de stockage rapide pour modèles et datasets.' },
    build: { cpu: 'r7-9700x', cooler: 'tr-pa120se', motherboard: 'msi-b850-tomahawk', ram: 'gskill-z5neo-ddr5-6000-64', gpu: 'rtx5070ti', storage: ['lexar-nm790-4tb'], psu: 'bq-pp12m-850', case: 'lianli-lancool217' },
  },
  {
    id: 'ultimate', useCase: 'gaming', target: '4K Ultra · Path tracing', accent: '#facc15',
    name: { en: 'No Compromise', de: 'Ohne Kompromisse', fr: 'Sans compromis' },
    desc: { en: 'RTX 5090, 9800X3D and Gen5 storage – the fastest gaming PC money can buy in 2026.', de: 'RTX 5090, 9800X3D und Gen5-SSD – der schnellste Gaming-PC, den man 2026 kaufen kann.', fr: 'RTX 5090, 9800X3D et SSD Gen5 – le PC gaming le plus rapide de 2026.' },
    build: { cpu: 'r7-9800x3d', cooler: 'lianli-galahad2-360', motherboard: 'asus-x870e-e', ram: 'gskill-z5neo-ddr5-6000-64', gpu: 'rtx5090', storage: ['samsung-9100pro-2tb'], psu: 'bq-sp12-1200', case: 'nzxt-h9-flow', fans: 'lianli-slinf-3pack' },
  },
]
