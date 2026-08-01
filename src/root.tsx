import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { ReactNode } from 'react'
import { SiteShell } from './components/site-shell'
import './styles.css'

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
        <SiteShell>{children}</SiteShell>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return <Outlet />
}
