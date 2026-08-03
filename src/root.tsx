import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import type { ReactNode } from 'react'
import type { PublicUser } from './data/auth-types'
import { SiteShell } from './components/site-shell'
import { I18nProvider } from './i18n/i18n'
import { LOCALE_COOKIE, resolveLocale, type Locale } from './i18n/locales'
import { loadAuthContext, withAuthCookies } from './lib/auth.server'
import { parseCookies } from './lib/session.server'
import './styles.css'

export async function loader({ request }: { request: Request }) {
  const auth = await loadAuthContext(request)
  const cookies = parseCookies(request.headers.get('Cookie'))
  const locale = resolveLocale(auth.user?.locale || cookies[LOCALE_COOKIE])
  return withAuthCookies(
    Response.json({ user: auth.user, csrfToken: auth.csrfToken, locale }),
    auth.setCookieHeaders,
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta content="#11161d" name="theme-color" />
        <title>天依档案 / Luo Tian Yi Fan Archive</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  const data = useLoaderData<{
    user: PublicUser | null
    csrfToken: string
    locale: Locale
  }>()
  return (
    <I18nProvider locale={data.locale}>
      <SiteShell csrfToken={data.csrfToken} locale={data.locale} user={data.user}>
        <Outlet />
      </SiteShell>
    </I18nProvider>
  )
}
