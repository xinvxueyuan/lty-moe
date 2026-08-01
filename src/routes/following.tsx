import { Bell, Heart, ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { WorkGrid } from '../components/catalog'
import { works } from '../data/catalog'
import { Button } from '../components/ui/button'

export default function Following() {
  const navigate = useNavigate()
  return (
    <section className="archive-container page-shell">
      <div className="page-intro">
        <div>
          <p className="eyebrow">YOUR SIGNAL / FOLLOWING</p>
          <h1>
            来自你
            <br />
            <em>关注的天依。</em>
          </h1>
        </div>
        <p className="page-intro-description">
          这里保存创作者最新的天依同人更新。
          <br />
          现在，先听一点好的。
        </p>
      </div>
      <div className="following-notice">
        <div>
          <Bell size={17} />
          <span>
            你正在关注 <b>12</b> 位天依同人创作者
          </span>
        </div>
        <Link to="/explore">
          管理关注 <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="following-heading">
        <h2>最近更新</h2>
        <span>过去 30 天</span>
      </div>
      <WorkGrid items={works.slice(1, 5)} />
      <div className="following-empty">
        <Heart size={20} />
        <p>关注更多创作者，让下一次打开档案时有新作品等你。</p>
        <Button onClick={() => navigate('/explore')} variant="outline">
          去探索
        </Button>
      </div>
    </section>
  )
}
