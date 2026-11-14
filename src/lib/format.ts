import type { Lang } from '../i18n'

const LOCALES: Record<Lang, string> = { en: 'en-IE', de: 'de-DE', fr: 'fr-FR' }

export function eur(n: number, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)
}

export function num(n: number, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: digits }).format(n)
}

export function capacity(gb: number): string {
  return gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`
}
