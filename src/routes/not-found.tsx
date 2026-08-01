import { ArrowLeft, Radio } from 'lucide-react'
import { Link } from 'react-router'

export default function NotFound() {
  return (
    <section className="archive-container not-found-page">
      <Radio className="text-[var(--cyan)]" size={32} />
      <p className="eyebrow">404 / SIGNAL LOST</p>
      <h1>
        这个页面没有
        <br />
        <em>留下回声。</em>
      </h1>
      <p>它可能还没有被归档，或者已经沿着另一条信号线离开了。</p>
      <Link className="signal-link" to="/">
        <ArrowLeft size={16} /> 返回首页
      </Link>
    </section>
  )
}
