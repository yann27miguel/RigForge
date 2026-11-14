import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Resolution } from '../data/games'
import type { Lang } from '../i18n'

function detectLang(): Lang {
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2)
  return n === 'de' || n === 'fr' ? n : 'en'
}

export type RgbMode = 'static' | 'breathe' | 'rainbow' | 'off'
export type ThemeMode = 'dark' | 'light' | 'system'

interface SettingsState {
  lang: Lang
  theme: ThemeMode
  rgbColor: string
  rgbMode: RgbMode
  explode: number
  labels: boolean
  glass: boolean
  autoRotate: boolean
  fanSpeed: number
  xray: boolean
  res: Resolution
  upscaling: boolean
  set: (p: Partial<Omit<SettingsState, 'set'>>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: detectLang(),
      theme: 'system',
      rgbColor: '#38e8c6',
      rgbMode: 'rainbow',
      explode: 0,
      labels: false,
      glass: true,
      autoRotate: false,
      fanSpeed: 0.5,
      xray: false,
      res: '1440p',
      upscaling: false,
      set: (p) => set(p),
    }),
    { name: 'rigforge-settings', partialize: ({ set: _s, explode: _e, ...rest }) => rest },
  ),
)
