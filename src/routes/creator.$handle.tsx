import { ArrowRight, ExternalLink, Heart, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { WorkGrid } from '../components/catalog'
import { getCreator, getCreatorWorks } from '../data/catalog'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export default function CreatorDetail() {
  const { handle = '' } = useParams()
  const creator = getCreator(handle)
  const creatorWorks = getCreatorWorks(handle)
  const [following, setFollowing] = useState(false)
  const [tab, setTab] = useState('works')
  return (
    <section className="archive-container page-shell creator-page">
      <div className={`creator-banner tone-bg-${creator.tone}`}>
        <span>FAN CREATOR FILE / @{creator.handle}</span>
        <div className="banner-wave" />
        <div className="banner-signal">✳</div>
      </div>
      <div className="creator-profile">
        <div className={`profile-avatar tone-${creator.tone}`}>{creator.initials}</div>
        <div className="profile-copy">
          <p className="eyebrow">CREATOR / 00{Math.max(1, creatorWorks.length)}</p>
          <h1>{creator.name}</h1>
          <p>@{creator.handle} · 洛天依同人创作者</p>
        </div>
        <Button
          className={following ? 'following-button' : ''}
          onClick={() => setFollowing((value) => !value)}
          variant={following ? 'outline' : 'primary'}
        >
          {following ? <Heart fill="currentColor" size={15} /> : <Plus size={15} />}{' '}
          {following ? '已关注' : '关注'}
        </Button>
      </div>
      <div className="creator-stats">
        <span>
          <b>{creator.followers}</b> 关注者
        </span>
        <span>
          <b>{creatorWorks.length + 14}</b> 作品
        </span>
        <span>
          <b>2021</b> 加入天依档案
        </span>
      </div>
      <Tabs onValueChange={setTab} value={tab}>
        <TabsList className="creator-tabs">
          <TabsTrigger value="works">
            作品 <small>{creatorWorks.length}</small>
          </TabsTrigger>
          <TabsTrigger value="saved">收藏夹</TabsTrigger>
          <TabsTrigger value="about">关于</TabsTrigger>
        </TabsList>
        <TabsContent value="works">
          <WorkGrid items={creatorWorks} />
        </TabsContent>
        <TabsContent value="saved">
          <div className="empty-state compact-empty">
            <Heart className="mx-auto mb-4 text-[var(--pink)]" size={20} />
            <h2>收藏夹还在整理</h2>
            <p>这个创作者的公开收藏会出现在这里。</p>
          </div>
        </TabsContent>
        <TabsContent value="about">
          <div className="creator-about">
            <p>{creator.bio}</p>
            <Link to="/explore">
              浏览相关作品 <ArrowRight size={15} />
            </Link>
            <a href={`https://github.com/${creator.handle}`} rel="noreferrer" target="_blank">
              查看创作者主页 <ExternalLink size={13} />
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
