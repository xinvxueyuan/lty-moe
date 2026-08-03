import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { translate, type MessageKey } from './messages'
import { defaultLocale, type Locale } from './locales'

type I18nValue = {
  locale: Locale
  t: (key: MessageKey, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nValue>({
  locale: defaultLocale,
  t: (key, vars) => translate(defaultLocale, key, vars),
})

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
