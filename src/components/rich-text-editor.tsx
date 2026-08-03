import { useRef, useState } from 'react'
import { Textarea } from './ui/textarea'
import { RichText } from './rich-text'

type Props = {
  name: string
  defaultValue?: string
  label?: string
  rows?: number
}

export function RichTextEditor({ name, defaultValue = '', label = '正文', rows = 16 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  function wrap(before: string, after = before) {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || 'text'
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    setValue(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  function insertBlock(prefix: string) {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    setValue(next)
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar">
        <span>{label}</span>
        <div className="rich-editor-actions">
          <button onClick={() => wrap('**')} type="button">
            B
          </button>
          <button onClick={() => wrap('*')} type="button">
            I
          </button>
          <button onClick={() => wrap('[', '](https://)')} type="button">
            Link
          </button>
          <button onClick={() => insertBlock('## ')} type="button">
            H2
          </button>
          <button onClick={() => insertBlock('- ')} type="button">
            List
          </button>
          <button onClick={() => insertBlock('> ')} type="button">
            Quote
          </button>
          <button onClick={() => wrap('`')} type="button">
            Code
          </button>
          <button
            className={tab === 'write' ? 'active' : ''}
            onClick={() => setTab('write')}
            type="button"
          >
            编辑
          </button>
          <button
            className={tab === 'preview' ? 'active' : ''}
            onClick={() => setTab('preview')}
            type="button"
          >
            预览
          </button>
        </div>
      </div>
      {tab === 'write' ? (
        <Textarea
          aria-label={label}
          className="editor-body"
          name={name}
          onChange={(event) => setValue(event.target.value)}
          ref={ref}
          rows={rows}
          value={value}
        />
      ) : (
        <>
          <input name={name} type="hidden" value={value} />
          <div className="rich-editor-preview">
            <RichText source={value || '*空内容*'} />
          </div>
        </>
      )}
    </div>
  )
}
