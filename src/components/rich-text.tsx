import { renderMarkdown } from '../lib/markdown'

export function RichText({ source, className = '' }: { source: string; className?: string }) {
  if (!source?.trim()) return null
  return (
    <div
      className={`rich-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
    />
  )
}
