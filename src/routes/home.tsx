import { ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { CategoryFilters, WorkGrid } from '../components/catalog'
import { featuredCreators, works } from '../data/catalog'
import type { FilterCategory } from '../data/types'
import { Badge } from '../components/ui/badge'

export default function Home() {
  const [category, setCategory] = useState<FilterCategory>('全部')
  const featured = works.find((work) => work.id === 'blue-hour') ?? works[0]
  const visibleWorks =
    category === '全部' ? works : works.filter((work) => work.category === category)

  return (
    <>
      <section className="hero-shell archive-container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> LUO TIAN YI FAN ARCHIVE / 2026
          </p>
          <h1>
            把她的声音，
            <br />
            <em>放进你的想象。</em>
          </h1>
          <p className="hero-description">
            一个围绕洛天依的非官方作品档案室。收录曲绘、PV、调音与所有被歌声点亮的片刻。
          </p>
          <div className="hero-actions">
            <Link className="signal-link" to="/explore">
              进入展厅 <ArrowUpRight size={17} />
            </Link>
            <span className="signal-line" />
          </div>
          <div className="hero-facts">
            <span>
              <b>06</b> 作品已归档
            </span>
            <span>
              <b>04</b> 创作者正在发光
            </span>
            <span>
              <b>∞</b> 种可能还在路上
            </span>
          </div>
        </div>
        <div className="hero-exhibit">
          <div className="signal-orbit signal-orbit-one" />
          <div className="signal-orbit signal-orbit-two" />
          <div className="hero-art-frame">
            <img alt={featured.title} src={featured.image} />
            <div className="hero-art-scan" />
          </div>
          <div className="hero-art-caption">
            <span>FEATURED FILE / 042</span>
            <strong>{featured.title}</strong>
            <small>
              {featured.creator} · {featured.date}
            </small>
          </div>
          <Badge className="hero-stamp">
            天依
            <br />蓝
          </Badge>
          <div className="hero-side-note">
            <span>听见</span>
            <span>被看见</span>
            <span>再发光</span>
          </div>
        </div>
      </section>
      <section className="archive-container archive-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FAN FLOW / 01</p>
            <h2>今天，大家在唱</h2>
          </div>
          <Link className="text-link-muted" to="/explore">
            查看全部 <ArrowUpRight size={15} />
          </Link>
        </div>
        <CategoryFilters onChange={setCategory} value={category} />
        <WorkGrid featuredFirst items={visibleWorks} />
      </section>
      <section className="archive-container creator-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FAN CREATORS / 02</p>
            <h2>正在为天依发光的人</h2>
          </div>
          <Sparkles className="section-spark" size={22} />
        </div>
        <div className="creator-list">
          {featuredCreators.map((creator, index) => (
            <Link
              className="creator-list-row"
              key={creator.handle}
              to={`/creator/${creator.handle}`}
            >
              <span className="creator-number">0{index + 1}</span>
              <span className={`creator-avatar tone-${creator.tone}`}>{creator.initials}</span>
              <span className="creator-list-name">
                <strong>{creator.name}</strong>
                <small>@{creator.handle}</small>
              </span>
              <span className="creator-bio">{creator.bio}</span>
              <span className="creator-followers">
                {creator.followers}
                <small>关注者</small>
              </span>
              <ChevronRight className="creator-chevron" size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
