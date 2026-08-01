import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router'
import submissions from './data/submissions.json'
import { seedWorks } from './data/works'

const works = [...seedWorks, ...submissions]

const featuredCreators = [
  { name: 'Sora Kim', handle: 'sora-kim', initials: 'SK', tone: 'violet', followers: '18.4k' },
  { name: 'Yukiko Arai', handle: 'yukiko_rai', initials: 'YA', tone: 'sage', followers: '12.1k' },
  { name: 'Mia Park', handle: 'miapark', initials: 'MP', tone: 'peach', followers: '9.8k' },
]

const categories = ['全部', '插画', '摄影', '绘画', '概念设计', '3D / 动画']

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    heart: <path d="M20.8 8.7c0 5.2-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z" />,
    bookmark: <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    send: <><path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" /><path d="M10.3 13.7 21 3" /></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Layout({ children }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  function submitSearch(event) {
    event.preventDefault()
    if (search.trim()) navigate(`/explore?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="wordmark" aria-label="天依档案首页">
          天依<span>档案</span><i>FN</i>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <NavLink end to="/" className={({ isActive }) => isActive ? 'active' : ''}>首页</NavLink>
          <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''}>探索</NavLink>
          <NavLink to="/following" className={({ isActive }) => isActive ? 'active' : ''}>关注</NavLink>
        </nav>
        <div className="top-actions">
          <button className="icon-button search-button" aria-label="搜索" onClick={() => setSearchOpen((value) => !value)}><Icon name="search" /></button>
          <Link to="/upload" className="upload-link"><Icon name="plus" size={16} /> 发布作品</Link>
          <button className="avatar-button" aria-label="打开个人资料"><span>LY</span></button>
        </div>
        {searchOpen && <form className="search-popover" onSubmit={submitSearch}>
          <Icon name="search" size={17} />
          <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索作品、创作者或标签" />
          <kbd>Enter</kbd>
        </form>}
      </header>
      <main key={location.pathname} className="page-transition">{children}</main>
      <footer className="site-footer">
        <div><span className="footer-mark">天依档案</span><span className="footer-note">让每一声都被听见。</span></div>
        <div className="footer-links"><span>关于天依档案</span><span>使用条款</span><span>隐私</span><span>© 2024</span></div>
      </footer>
    </div>
  )
}

function ArtworkCard({ work, featured = false }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <article className={`art-card ${featured ? 'featured-card' : ''}`}>
      <Link to={`/works/${work.id}`} className="art-image-wrap">
        <img src={work.image} alt={work.title} className="art-image" loading="lazy" />
        <span className="image-label">{work.category}</span>
        <span className="view-work">查看作品 <Icon name="arrow" size={14} /></span>
      </Link>
      <div className="art-meta">
        <div>
          <Link to={`/works/${work.id}`} className="art-title">{work.title}</Link>
          <Link to={`/creator/${work.handle}`} className="art-creator">by {work.creator}</Link>
        </div>
        <div className="card-actions">
          <button className={liked ? 'liked' : ''} onClick={() => setLiked((value) => !value)} aria-label="喜欢"><Icon name="heart" size={17} /><span>{liked ? '已喜欢' : work.likes}</span></button>
          <button className={saved ? 'saved' : ''} onClick={() => setSaved((value) => !value)} aria-label="收藏"><Icon name="bookmark" size={16} /></button>
        </div>
      </div>
    </article>
  )
}

function Home() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const visibleWorks = activeCategory === '全部' ? works : works.filter((work) => work.category === activeCategory)
  return <>
    <section className="masthead">
      <div className="masthead-copy">
        <p className="eyebrow"><span className="pulse-dot" /> 洛天依同人档案 · 06.18</p>
        <h1>她的声音<br /><em>住进每种想象。</em></h1>
        <p className="masthead-intro">一个围绕洛天依的非官方作品档案室。收录曲绘、PV、调音与所有被歌声点亮的片刻。</p>
        <div className="masthead-cta"><Link to="/explore" className="text-link">进入天依展厅 <Icon name="arrow" size={15} /></Link><span className="rule" /></div>
      </div>
      <div className="masthead-exhibit">
        <div className="exhibit-frame"><img src={works[3].image} alt="Blue Hour Studies" /></div>
        <div className="exhibit-caption"><span>LUO TIAN YI / 042</span><b>天依蓝 / Blue Hour</b><small>Sora Kim · 同人绘</small></div>
        <div className="exhibit-stamp">天<br />依<br />蓝</div>
      </div>
    </section>
    <section className="feed-section section-shell">
      <div className="section-heading"><div><p className="eyebrow">天依同人精选 / FAN FLOW</p><h2>今天，大家在唱</h2></div><Link to="/explore" className="quiet-link">浏览全部 <Icon name="arrow" size={14} /></Link></div>
      <div className="category-row" role="tablist" aria-label="作品分类">
        {categories.map((category) => <button key={category} className={activeCategory === category ? 'selected' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}
      </div>
      <div className="art-grid">{visibleWorks.map((work, index) => <ArtworkCard key={work.id} work={work} featured={index === 0} />)}</div>
      {visibleWorks.length === 0 && <div className="empty-state">这一栏还在收集新作品。</div>}
    </section>
    <CreatorStrip />
  </>
}

function CreatorStrip() {
  return <section className="creator-strip section-shell"><div className="section-heading"><div><p className="eyebrow">本周值得关注 / FAN CREATORS</p><h2>正在为天依发光的人</h2></div><Link to="/explore" className="quiet-link">发现更多 <Icon name="arrow" size={14} /></Link></div><div className="creator-list">{featuredCreators.map((creator, index) => <Link to={`/creator/${creator.handle}`} className="creator-row" key={creator.handle}><span className="creator-index">0{index + 1}</span><span className={`creator-avatar ${creator.tone}`}>{creator.initials}</span><span className="creator-name"><b>{creator.name}</b><small>@{creator.handle}</small></span><span className="creator-followers">{creator.followers} followers</span><span className="creator-arrow"><Icon name="arrow" size={15} /></span></Link>)}</div></section>
}

function Explore() {
  const params = new URLSearchParams(useLocation().search)
  const query = params.get('q') || ''
  const [activeCategory, setActiveCategory] = useState('全部')
  const filtered = useMemo(() => works.filter((work) => {
    const matchesCategory = activeCategory === '全部' || work.category === activeCategory
    const matchesQuery = !query || `${work.title}${work.creator}${work.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [activeCategory, query])
  return <section className="explore-page section-shell"><div className="page-intro"><div><p className="eyebrow">发现 / EXPLORE</p><h1>找到你的<br /><em>下一份灵感。</em></h1></div><p className="page-description">从正在被看见的视觉作品，到还没有名字的想法。<br />在这里，慢一点浏览。</p></div><div className="explore-toolbar"><div className="category-row">{categories.map((category) => <button key={category} className={activeCategory === category ? 'selected' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><span className="result-count">{query ? `“${query}” · ` : ''}{filtered.length} 个作品</span></div><div className="art-grid explore-grid">{filtered.map((work) => <ArtworkCard key={work.id} work={work} />)}</div>{filtered.length === 0 && <div className="empty-state">没有找到匹配的作品，试试别的关键词。</div>}</section>
}

function Following() {
  return <section className="following-page section-shell"><div className="page-intro compact"><div><p className="eyebrow">你的视线 / FOLLOWING</p><h1>来自你<br /><em>关注的天依。</em></h1></div><p className="page-description">这里会保存创作者最新的天依同人更新。<br />现在，先听一点好的。</p></div><div className="follow-note"><span className="pulse-dot" /> 你正在关注 12 位天依同人创作者 <Link to="/explore">管理关注 <Icon name="arrow" size={14} /></Link></div><div className="art-grid">{works.slice(1, 5).map((work) => <ArtworkCard key={work.id} work={work} />)}</div></section>
}

function Creator() {
  const { handle } = useParams()
  const creator = featuredCreators.find((item) => item.handle === handle) || featuredCreators[0]
  const creatorWorks = works.filter((work) => work.handle === creator.handle || (creator.handle === 'sora-kim' && ['blue-hour', 'the-last-sun'].includes(work.id)) || (creator.handle === 'yukiko_rai' && work.id === 'small-rituals'))
  const [following, setFollowing] = useState(false)
  return <section className="creator-page section-shell"><div className={`profile-banner ${creator.tone}`}><span className="banner-mark">LUO TIAN YI / FAN CREATOR FILE</span><span className="banner-scribble">✳</span></div><div className="profile-header"><div className={`profile-avatar ${creator.tone}`}>{creator.initials}</div><div className="profile-info"><p className="eyebrow">FAN CREATOR / 00{featuredCreators.indexOf(creator) + 1}</p><h1>{creator.name}</h1><p>@{creator.handle} · 洛天依同人创作者</p></div><div className="profile-actions"><button className={`follow-button ${following ? 'following' : ''}`} onClick={() => setFollowing((value) => !value)}>{following ? '已关注' : '关注'} <Icon name={following ? 'heart' : 'plus'} size={15} /></button><button className="more-button">•••</button></div></div><div className="profile-stats"><span><b>{creator.followers}</b> 关注者</span><span><b>{creatorWorks.length + 14}</b> 作品</span><span><b>2021</b> 加入天依档案</span></div><div className="creator-tabs"><span className="active">作品</span><span>收藏夹</span><span>关于</span></div><div className="art-grid">{creatorWorks.map((work) => <ArtworkCard key={work.id} work={work} />)}</div></section>
}

function WorkDetail() {
  const { id } = useParams()
  const work = works.find((item) => item.id === id) || works[0]
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [comments, setComments] = useState('')
  return <section className="detail-page section-shell"><button className="back-link" onClick={() => navigate(-1)}>← 返回上一页</button><div className="detail-layout"><div className="detail-visual"><img src={work.image} alt={work.title} /><span className="detail-tag">{work.category} · {work.date} · 洛天依同人</span></div><aside className="detail-aside"><p className="eyebrow">LUO TIAN YI FAN ARCHIVE / {work.date.replaceAll('.', '')}</p><h1>{work.title}</h1><Link to={`/creator/${work.handle}`} className="detail-creator"><span className={`mini-avatar ${work.handle === 'sora-kim' ? 'violet' : 'peach'}`}>{work.creator.split(' ').map((part) => part[0]).join('')}</span><span><b>{work.creator}</b><small>@{work.handle} · 同人创作者</small></span><Icon name="arrow" size={15} /></Link><p className="detail-description">{work.description}</p><div className="palette"><span>TIANYI BLUE / COLOR NOTES</span><div>{work.palette.map((color) => <i key={color} style={{ background: color }} title={color} />)}</div></div><div className="detail-actions"><button className={liked ? 'liked' : ''} onClick={() => setLiked((value) => !value)}><Icon name="heart" size={19} /> {liked ? '已喜欢' : `喜欢 ${work.likes}`}</button><button className={saved ? 'saved' : ''} onClick={() => setSaved((value) => !value)}><Icon name="bookmark" size={18} /> {saved ? '已收藏' : '收藏'}</button><button aria-label="分享"><Icon name="send" size={18} /></button></div><div className="comment-box"><div><span>评论（{work.comments}）</span><span className="comment-note">友善地说点什么</span></div><textarea value={comments} onChange={(event) => setComments(event.target.value)} placeholder="写下你想对天依说的话..." /><button disabled={!comments.trim()} onClick={() => setComments('')}>发送评论</button></div></aside></div><div className="detail-next"><span>接着看</span><Link to={`/works/${works[(works.findIndex((item) => item.id === id) + 1) % works.length].id}`}>下一件天依作品 <Icon name="arrow" size={15} /></Link></div></section>
}

function Upload() {
  return <section className="upload-page section-shell"><div className="upload-card"><div className="upload-icon"><Icon name="plus" size={25} /></div><p className="eyebrow">NEW FAN ARCHIVE / 01</p><h1>把天依同人<br /><em>分享出来。</em></h1><p>这是一个静态演示入口。真正的上传功能将在这里展开，欢迎带着你的曲绘、PV 与歌声来。</p><Link to="/" className="text-link">返回天依首页 <Icon name="arrow" size={15} /></Link></div></section>
}

function App() {
  return <Layout><RoutesContent /></Layout>
}

function RoutesContent() {
  const location = useLocation()
  if (location.pathname === '/') return <Home />
  if (location.pathname === '/explore') return <Explore />
  if (location.pathname === '/following') return <Following />
  if (location.pathname === '/upload') return <Upload />
  if (location.pathname.startsWith('/creator/')) return <Creator />
  if (location.pathname.startsWith('/works/')) return <WorkDetail />
  return <Home />
}

export default App
