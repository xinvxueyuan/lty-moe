import {
  Search,
  Plus,
  ArrowUpRight,
  Radio,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  User,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Form, Link, NavLink, useNavigate } from 'react-router'
import type { PublicUser } from '../data/auth-types'
import { useI18n } from '../i18n/i18n'
import type { Locale } from '../i18n/locales'
import { Button } from './ui/button'
import { Dialog, DialogHeader } from './ui/dialog'
import { Input } from './ui/input'

export function SiteShell({
  children,
  user = null,
  locale = 'zh-CN',
  csrfToken = '',
}: {
  children: ReactNode
  user?: PublicUser | null
  locale?: Locale
  csrfToken?: string
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const navigation = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/explore', label: t('nav.explore'), end: false },
    { to: '/following', label: t('nav.following'), end: false },
  ]

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setSearchOpen(false)
    setMobileOpen(false)
    navigate(`/explore?q=${encodeURIComponent(value)}`)
  }

  const initials = user ? user.displayName.slice(0, 2).toUpperCase() : 'LY'

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link aria-label={t('nav.home')} className="wordmark" to="/">
            <span className="wordmark-signal">
              <Radio size={17} strokeWidth={1.7} />
            </span>
            <span>天依档案</span>
            <small>ARCHIVE / 01</small>
          </Link>
          <nav aria-label="主导航" className="desktop-nav">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <Form action="/locale" className="locale-switch" method="post">
              <input name="_csrf" type="hidden" value={csrfToken} />
              <label className="sr-only" htmlFor="locale-select">
                {t('common.language')}
              </label>
              <select
                aria-label={t('common.language')}
                defaultValue={locale}
                id="locale-select"
                name="locale"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                <option value="zh-CN">中文</option>
                <option value="en">EN</option>
              </select>
            </Form>
            <Button
              aria-label={t('nav.search')}
              onClick={() => setSearchOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Search size={18} />
            </Button>
            <Link
              className="header-submit"
              to={user ? '/dashboard/works/new' : '/login?next=/dashboard/works/new'}
            >
              <Plus size={16} /> <span>{t('nav.publish')}</span>
            </Link>
            {user ? (
              <div className="header-user">
                <Link
                  aria-label={t('nav.account')}
                  className="header-avatar"
                  to="/account"
                  title={user.displayName}
                >
                  {initials}
                </Link>
                <Link aria-label={t('nav.dashboard')} className="header-icon-link" to="/dashboard">
                  <LayoutDashboard size={17} />
                </Link>
                {user.role === 'admin' ? (
                  <Link className="header-icon-link" to="/admin">
                    管
                  </Link>
                ) : null}
                <Form action="/logout" method="post">
                  <button aria-label={t('nav.logout')} className="header-icon-link" type="submit">
                    <LogOut size={16} />
                  </button>
                </Form>
              </div>
            ) : (
              <Link
                aria-label={t('nav.login')}
                className="header-avatar header-avatar-guest"
                to="/login"
              >
                <User size={16} />
              </Link>
            )}
            <Button
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              className="mobile-menu-button"
              onClick={() => setMobileOpen((value) => !value)}
              size="icon"
              variant="ghost"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav aria-label="移动端主导航" className="mobile-nav">
            {navigation.map((item) => (
              <NavLink
                className="mobile-nav-link"
                end={item.end}
                key={item.to}
                onClick={() => setMobileOpen(false)}
                to={item.to}
              >
                {item.label}
                <ArrowUpRight size={15} />
              </NavLink>
            ))}
            {user ? (
              <>
                <Link
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                  to="/dashboard"
                >
                  {t('nav.dashboard')}
                  <LayoutDashboard size={15} />
                </Link>
                <Link
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                  to="/account"
                >
                  {t('nav.account')}
                  <User size={15} />
                </Link>
              </>
            ) : (
              <Link className="mobile-nav-link" onClick={() => setMobileOpen(false)} to="/login">
                {t('nav.login')}
                <User size={15} />
              </Link>
            )}
          </nav>
        )}
      </header>
      <main className="page-transition">{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="footer-mark" to="/">
            天依档案
          </Link>
          <span className="footer-note">{t('footer.tagline')}</span>
        </div>
        <div className="footer-meta">
          <span>{t('footer.unofficial')}</span>
          <span>© 2026</span>
          <Link to={user ? '/dashboard/works/new' : '/login'}>
            {t('footer.share')} <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
      <Dialog onOpenChange={setSearchOpen} open={searchOpen}>
        <DialogHeader
          eyebrow="SEARCH / ARCHIVE"
          onClose={() => setSearchOpen(false)}
          title={t('nav.search')}
        />
        <form className="mt-8" onSubmit={submitSearch}>
          <div className="relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--muted)]"
              size={18}
            />
            <Input
              autoFocus
              className="pr-20 pl-11"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="天依蓝 / Sora / illustration"
              value={query}
            />
            <kbd>ENTER</kbd>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
