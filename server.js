import { createRequestListener } from '@react-router/node'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const port = Number(process.env.PORT || 3000)
const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
const clientDir = join(process.cwd(), 'build', 'client')

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function serveFile(filePath, response) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return false
  const type = mimeTypes[extname(filePath)] || 'application/octet-stream'
  response.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': type.startsWith('image/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=31536000, immutable',
  })
  createReadStream(filePath).pipe(response)
  return true
}

const build = await import('./build/server/index.js')

const requestListener = createRequestListener({ build })

const server = createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (url.pathname.startsWith('/uploads/')) {
    const filePath = resolve(uploadsDir, normalize(url.pathname.slice('/uploads/'.length)))
    if (filePath.startsWith(uploadsDir) && serveFile(filePath, response)) return
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const assetPath = normalize(url.pathname.replace(/^\/+/, ''))
    const clientFile = resolve(clientDir, assetPath)
    if (clientFile.startsWith(clientDir) && serveFile(clientFile, response)) return
  }

  requestListener(request, response)
})

server.listen(port, () => {
  console.log(`lty-moe archive running on http://localhost:${port}`)
})
