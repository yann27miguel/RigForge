import { useCallback } from 'react'
import { useSettings } from '../store/settings'
import de from './de'
import en from './en'
import fr from './fr'

export type Lang = 'en' | 'de' | 'fr'
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: 'EN' },
  { id: 'de', label: 'Deutsch', flag: 'DE' },
  { id: 'fr', label: 'Français', flag: 'FR' },
]

const DICTS = { en, de, fr }

function lookup(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = lookup(DICTS[lang], key) ?? lookup(en, key)
  if (typeof s !== 'string') return key
  if (params) for (const [k, v] of Object.entries(params)) s = (s as string).split(`{${k}}`).join(String(v))
  return s as string
}

export function useT() {
  const lang = useSettings((s) => s.lang)
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang])
  const list = useCallback((key: string): string[] => {
    const v = lookup(DICTS[lang], key) ?? lookup(en, key)
    return Array.isArray(v) ? (v as string[]) : []
  }, [lang])
  return { t, lang, list }
}
