/** Lightweight markdown → safe HTML for work bodies. No external deps. */

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function inline(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>',
  )
  return out
}

export function renderMarkdown(source: string): string {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
  const html: string[] = []
  let i = 0
  let inUl = false
  let inOl = false
  let inCode = false
  let codeBuf: string[] = []

  function closeLists() {
    if (inUl) {
      html.push('</ul>')
      inUl = false
    }
    if (inOl) {
      html.push('</ol>')
      inOl = false
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
        codeBuf = []
        inCode = false
      } else {
        closeLists()
        inCode = true
      }
      i += 1
      continue
    }
    if (inCode) {
      codeBuf.push(line)
      i += 1
      continue
    }

    if (!line.trim()) {
      closeLists()
      i += 1
      continue
    }

    if (/^###\s+/.test(line)) {
      closeLists()
      html.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`)
    } else if (/^##\s+/.test(line)) {
      closeLists()
      html.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`)
    } else if (/^#\s+/.test(line)) {
      closeLists()
      html.push(`<h1>${inline(line.replace(/^#\s+/, ''))}</h1>`)
    } else if (/^>\s?/.test(line)) {
      closeLists()
      html.push(`<blockquote><p>${inline(line.replace(/^>\s?/, ''))}</p></blockquote>`)
    } else if (/^[-*]\s+/.test(line)) {
      if (!inUl) {
        closeLists()
        html.push('<ul>')
        inUl = true
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`)
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        closeLists()
        html.push('<ol>')
        inOl = true
      }
      html.push(`<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`)
    } else if (/^---+$/.test(line.trim())) {
      closeLists()
      html.push('<hr />')
    } else {
      closeLists()
      html.push(`<p>${inline(line)}</p>`)
    }
    i += 1
  }

  if (inCode) html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
  closeLists()
  return html.join('\n')
}
