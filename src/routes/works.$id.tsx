import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Bot,
  ExternalLink,
  Heart,
  MessageCircle,
  Send,
  UserRoundCog,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { getCreator } from '../data/catalog'
import type { Work } from '../data/types'
import { getWorkById, listWorks } from '../db/client.server'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { fetchWork, fetchWorks } from '../lib/api'
import { getCachedWork, getCachedWorks, setCachedWork, setCachedWorks } from '../lib/works-cache'

export async function loader({ params }: { params: { id: string } }) {
  const work = await getWorkById(params.id)
  if (!work) throw new Response('Not found', { status: 404 })
  const works = await listWorks()
  const currentIndex = works.findIndex((item) => item.id === work.id)
  const nextWork = works[(currentIndex + 1) % works.length]
  return { work, nextWork }
}

export async function clientLoader({
  params,
  serverLoader,
}: {
  params: { id: string }
  serverLoader: () => Promise<{ work: Work; nextWork: Work }>
}) {
  const cachedWork = getCachedWork(params.id)
  let works = getCachedWorks()
  if (cachedWork && works?.length) {
    const currentIndex = works.findIndex((item) => item.id === cachedWork.id)
    const nextWork = works[(currentIndex + 1) % works.length] ?? cachedWork
    return { work: cachedWork, nextWork }
  }
  try {
    const [work, list] = await Promise.all([
      fetchWork(params.id),
      works ? Promise.resolve(works) : fetchWorks(),
    ])
    works = list
    setCachedWorks(works)
    setCachedWork(work)
    const currentIndex = works.findIndex((item) => item.id === work.id)
    const nextWork = works[(currentIndex + 1) % works.length] ?? work
    return { work, nextWork }
  } catch {
    const data = await serverLoader()
    setCachedWork(data.work)
    return data
  }
}

export default function WorkDetail() {
  const { work, nextWork } = useLoaderData<{ work: Work; nextWork: Work }>()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [comment, setComment] = useState('')
  const creator = getCreator(work.handle)
  return (
    <section className="archive-container page-shell detail-page">
      <button className="back-button" onClick={() => navigate(-1)} type="button">
        <ArrowLeft size={15} /> 返回上一页
      </button>
      <div className="detail-layout">
        <div className="detail-image-wrap">
          <img
            alt={work.title}
            className="detail-image"
            height="1000"
            src={work.image}
            width="1200"
          />
          <Badge className="detail-image-label">
            {work.category} · {work.date}
          </Badge>
        </div>
        <aside className="detail-aside">
          <p className="eyebrow">LUO TIAN YI FAN FILE / {work.date.replaceAll('.', '')}</p>
          <h1>{work.title}</h1>
          <Link className="detail-creator" to={`/creator/${work.handle}`}>
            <span className={`creator-avatar tone-${creator.tone}`}>{creator.initials}</span>
            <span>
              <strong>{work.creator}</strong>
              <small>@{work.handle} · 同人创作者</small>
            </span>
            <ArrowRight size={16} />
          </Link>
          <p className="detail-description">{work.description}</p>
          <div className="palette-row">
            <span>COLOR NOTES</span>
            <div>
              {work.palette.map((color) => (
                <i
                  aria-label={color}
                  key={color}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <section aria-label="版权与署名信息" className="rights-signal">
            <div className="rights-signal-heading">
              <span>RIGHTS & CREDIT / 04</span>
              <Badge
                className={`origin-badge ${work.origin === '原创' ? 'origin-original' : work.origin === '转载' ? 'origin-repost' : 'origin-undeclared'}`}
              >
                {work.origin} /{' '}
                {work.origin === '原创'
                  ? 'ORIGINAL'
                  : work.origin === '转载'
                    ? 'REPOST'
                    : 'UNDECLARED'}
              </Badge>
            </div>
            <div className="rights-grid">
              <div className="rights-cell">
                <BadgeCheck size={16} />
                <span>许可证 / LICENSE</span>
                <strong>{work.license}</strong>
              </div>
              <div className="rights-cell">
                <UserRoundCog size={16} />
                <span>维护者 / MAINTAINERS</span>
                <strong>{work.maintainers.length ? work.maintainers.join('、') : '未记录'}</strong>
              </div>
              <div className="rights-cell">
                <UsersRound size={16} />
                <span>共同作者 / CO-AUTHORS</span>
                <strong>
                  {work.coAuthors.length ? work.coAuthors.join('、') : '暂无共同作者'}
                </strong>
              </div>
              <div className="rights-cell rights-cell-ai">
                <Bot size={16} />
                <span>AI 使用声明 / AI DISCLOSURE</span>
                <Badge>{work.aiDisclosure}</Badge>
              </div>
            </div>
          </section>
          <div className="detail-actions">
            <Button
              className={liked ? 'detail-action-active' : ''}
              onClick={() => setLiked((value) => !value)}
              variant="outline"
            >
              <Heart fill={liked ? 'currentColor' : 'none'} size={17} />{' '}
              {liked ? '已喜欢' : `喜欢 ${work.likes}`}
            </Button>
            <Button
              aria-label="收藏作品"
              className={saved ? 'detail-action-active' : ''}
              onClick={() => setSaved((value) => !value)}
              size="icon"
              variant="outline"
            >
              <Bookmark fill={saved ? 'currentColor' : 'none'} size={17} />
            </Button>
            <Button aria-label="分享作品" size="icon" variant="outline">
              <Send size={17} />
            </Button>
          </div>
          <div className="comment-panel">
            <div className="comment-heading">
              <span>
                <MessageCircle size={15} /> 评论 {work.comments}
              </span>
              <span>友善地说点什么</span>
            </div>
            <Textarea
              onChange={(event) => setComment(event.target.value)}
              placeholder="写下你想对天依说的话……"
              value={comment}
            />
            <button
              className="comment-submit"
              disabled={!comment.trim()}
              onClick={() => setComment('')}
              type="button"
            >
              发送评论 <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
      <div className="detail-next">
        <span>接着看 / NEXT FILE</span>
        <Link to={`/works/${nextWork.id}`}>
          {nextWork.title} <ArrowRight size={15} />
        </Link>
      </div>
      {work.sourceUrl && (
        <a className="source-link" href={work.sourceUrl} rel="noreferrer" target="_blank">
          查看原作链接 <ExternalLink size={13} />
        </a>
      )}
    </section>
  )
}
