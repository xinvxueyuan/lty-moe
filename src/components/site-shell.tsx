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
import { Button } from './ui/button'
import { Dialog, DialogHeader } from './ui/dialog'
import { Input } from './ui/input'

const navigation = [
  { to: '/', label: '首页', end: true },
  { to: '/explore', label: '探索' },
  { to: '/following', label: '关注' },
]

export function SiteShell({
  children,
  user = null,
}: {
  children: ReactNode
  user?: PublicUser | null
}) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

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
          <Link aria-label="天依档案首页" className="wordmark" to="/">
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
            <Button
              aria-label="搜索作品"
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
              <Plus size={16} /> <span>{user ? '发布作品' : '投稿作品'}</span>
            </Link>
            {user ? (
              <div className="header-user">
                <Link
                  aria-label="用户中心"
                  className="header-avatar"
                  to="/account"
                  title={user.displayName}
                >
                  {initials}
                </Link>
                <Link aria-label="创作者仪表盘" className="header-icon-link" to="/dashboard">
                  <LayoutDashboard size={17} />
                </Link>
                {user.role === 'admin' ? (
                  <Link className="header-icon-link" to="/admin">
                    管
                  </Link>
                ) : null}
                <Form action="/logout" method="post">
                  <button aria-label="退出登录" className="header-icon-link" type="submit">
                    <LogOut size={16} />
                  </button>
                </Form>
              </div>
            ) : (
              <Link aria-label="登录" className="header-avatar header-avatar-guest" to="/login">
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
                  创作者仪表盘
                  <LayoutDashboard size={15} />
                </Link>
                <Link
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                  to="/account"
                >
                  用户中心
                  <User size={15} />
                </Link>
                {user.role === 'admin' ? (
                  <Link
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                    to="/admin"
                  >
                    管理后台
                    <ArrowUpRight size={15} />
                  </Link>
                ) : null}
              </>
            ) : (
              <Link className="mobile-nav-link" onClick={() => setMobileOpen(false)} to="/login">
                登录 / 注册
                <User size={15} />
              </Link>
            )}
            <Link
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
              to={user ? '/dashboard/works/new' : '/login'}
            >
              {user ? '发布作品' : '投稿作品'}
              <Plus size={15} />
            </Link>
          </nav>
        )}
      </header>
      <main className="page-transition">{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="footer-mark" to="/">
            天依档案
          </Link>
          <span className="footer-note">收集每一种被歌声点亮的想象。</span>
        </div>
        <div className="footer-meta">
          <span>非官方同人项目</span>
          <span>© 2026</span>
          <Link to={user ? '/dashboard/works/new' : '/login'}>
            分享你的作品 <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
      <Dialog onOpenChange={setSearchOpen} open={searchOpen}>
        <DialogHeader
          eyebrow="SEARCH / ARCHIVE"
          onClose={() => setSearchOpen(false)}
          title="搜索你想找的声音"
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
              placeholder="作品、创作者、类型"
              value={query}
            />
            <kbd>ENTER</kbd>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">试试 “天依蓝”、 “Sora” 或 “插画”。</p>
        </form>
      </Dialog>
    </div>
  )
}
