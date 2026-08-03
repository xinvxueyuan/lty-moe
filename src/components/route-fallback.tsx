export function RouteFallback({
  eyebrow = 'LOADING',
  title = '档案加载中…',
}: {
  eyebrow?: string
  title?: string
}) {
  return (
    <section aria-busy="true" aria-live="polite" className="archive-container page-shell">
      <div className="page-intro">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>
            {title}
            <br />
            <em>请稍候。</em>
          </h1>
        </div>
        <p className="page-intro-description">正在从档案库取回作品数据。</p>
      </div>
      <div className="route-fallback-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="route-fallback-card" key={index}>
            <div className="route-fallback-image" />
            <div className="route-fallback-line" />
            <div className="route-fallback-line short" />
          </div>
        ))}
      </div>
    </section>
  )
}
