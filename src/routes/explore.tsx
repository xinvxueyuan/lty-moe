import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { CategoryFilters, ResultsToolbar, useFilteredWorks, WorkGrid } from '../components/catalog'
import type { FilterCategory, Work } from '../data/types'
import { Input } from '../components/ui/input'
import { listWorks } from '../db/client.server'

export async function loader() {
  return { works: await listWorks() }
}

export default function Explore() {
  const { works } = useLoaderData<{ works: Work[] }>()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<FilterCategory>('全部')
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const visibleWorks = useFilteredWorks(works, category, query)

  function updateQuery(value: string) {
    setQuery(value)
  }

  return (
    <section className="archive-container page-shell">
      <div className="page-intro">
        <div>
          <p className="eyebrow">DISCOVER / EXPLORE</p>
          <h1>
            慢一点，
            <br />
            <em>找到下一份灵感。</em>
          </h1>
        </div>
        <p className="page-intro-description">
          从正在被看见的视觉作品，
          <br />
          到还没有名字的想法。
        </p>
      </div>
      <div className="explore-search">
        <Search size={18} />
        <Input
          aria-label="搜索作品"
          onChange={(event) => updateQuery(event.target.value)}
          onInput={(event) => updateQuery(event.currentTarget.value)}
          placeholder="搜索作品、创作者或标签"
          value={query}
        />
        {query && (
          <button aria-label="清除搜索" onClick={() => updateQuery('')} type="button">
            <X size={16} />
          </button>
        )}
      </div>
      <div className="explore-toolbar">
        <CategoryFilters onChange={setCategory} value={category} />
        <ResultsToolbar count={visibleWorks.length} query={query} />
      </div>
      <WorkGrid items={visibleWorks} />
      <p className="page-after-note">
        还没找到想看的？
        <Link to="/upload">
          把你的作品放进档案 <span>↗</span>
        </Link>
      </p>
    </section>
  )
}
