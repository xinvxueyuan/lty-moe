export const locales = ['zh-CN', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'zh-CN'
export const LOCALE_COOKIE = 'lty_locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value))
}

export function resolveLocale(input?: string | null): Locale {
  if (isLocale(input)) return input
  if (input?.toLowerCase().startsWith('zh')) return 'zh-CN'
  if (input?.toLowerCase().startsWith('en')) return 'en'
  return defaultLocale
}
