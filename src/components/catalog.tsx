import { Bookmark, Heart, ArrowUpRight, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FilterCategory, Work } from '../data/types'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export const filterCategories: FilterCategory[] = [
  '全部',
  '插画',
  '曲绘',
  '摄影',
  '绘画',
  '概念设计',
  'PV / 动画',
  '3D / 动画',
]

export function CategoryFilters({
  value,
  onChange,
}: {
  value: FilterCategory
  onChange: (value: FilterCategory) => void
}) {
  return (
    <div aria-label="作品分类" className="filter-row" role="tablist">
      {filterCategories.map((category) => (
        <button
          aria-selected={value === category}
          className={cn('filter-chip', value === category && 'filter-chip-active')}
          key={category}
          onClick={() => onChange(category)}
          role="tab"
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  )
}

export function filterWorks(works: Work[], category: FilterCategory, query = '') {
  const normalizedQuery = query.toLowerCase().trim()
  return works.filter((work) => {
    const matchesCategory = category === '全部' || work.category === category
    const searchable = `${work.title} ${work.creator} ${work.handle} ${work.category}`.toLowerCase()
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
  })
}

export function WorkCard({ work, featured = false }: { work: Work; featured?: boolean }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <article className={cn('work-card', featured && 'work-card-featured')}>
      <Link className="work-image-link" to={`/works/${work.id}`}>
        <img
          alt={work.title}
          className="work-image"
          height="600"
          loading="lazy"
          src={work.image}
          width="800"
        />
        <span className="work-index">
          {String(work.id.length).padStart(2, '0')} / {work.category}
        </span>
        <span className="work-hover-label">
          打开作品 <ArrowUpRight size={15} />
        </span>
      </Link>
      <div className="work-card-meta">
        <div className="min-w-0">
          <Link className="work-title" to={`/works/${work.id}`}>
            {work.title}
          </Link>
          <Link className="work-creator" to={`/creator/${work.handle}`}>
            @{work.handle}
          </Link>
        </div>
        <div className="work-card-actions">
          <button
            aria-label={`喜欢 ${work.title}`}
            className={cn('action-button', liked && 'action-button-active')}
            onClick={() => setLiked((value) => !value)}
            type="button"
          >
            <Heart fill={liked ? 'currentColor' : 'none'} size={15} />
            <span>{liked ? '已喜欢' : work.likes}</span>
          </button>
          <button
            aria-label={`收藏 ${work.title}`}
            className={cn('action-button', saved && 'action-button-saved')}
            onClick={() => setSaved((value) => !value)}
            type="button"
          >
            <Bookmark fill={saved ? 'currentColor' : 'none'} size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function WorkGrid({
  items,
  featuredFirst = false,
}: {
  items: Work[]
  featuredFirst?: boolean
}) {
  if (!items.length) return <EmptyState />
  return (
    <div className="work-grid">
      {items.map((work, index) => (
        <WorkCard featured={featuredFirst && index === 0} key={work.id} work={work} />
      ))}
    </div>
  )
}

export function EmptyState({
  title = '这里还没有找到作品',
  description = '换个关键词，或从全部分类重新开始。',
}: { title?: string; description?: string } = {}) {
  return (
    <div className="empty-state">
      <SlidersHorizontal className="mx-auto mb-4 text-[var(--cyan)]" size={20} />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

export function ResultsToolbar({ count, query }: { count: number; query?: string }) {
  return (
    <div className="results-toolbar">
      <span>
        <b>{count}</b> 件作品
        {query ? <span className="text-[var(--pink)]"> · “{query}”</span> : null}
      </span>
      <span className="results-sort">
        <span className="hidden sm:inline">按更新时间排序</span>
        <Button aria-label="筛选设置" size="icon" variant="ghost">
          <SlidersHorizontal size={16} />
        </Button>
      </span>
    </div>
  )
}

export function useFilteredWorks(works: Work[], category: FilterCategory, query: string) {
  return useMemo(() => filterWorks(works, category, query), [works, category, query])
}
