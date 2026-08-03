import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, normalize, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const mimeTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function serveUploads(): Plugin {
  return {
    name: 'serve-uploads',
    configureServer(server) {
      const uploadsDir = process.env.UPLOADS_DIR || resolve(process.cwd(), 'uploads')
      server.middlewares.use('/uploads', (request, response, next) => {
        const pathname = normalize((request.url ?? '/').replace(/^\/uploads\//, ''))
        const filePath = resolve(uploadsDir, pathname)
        if (
          !filePath.startsWith(uploadsDir) ||
          !existsSync(filePath) ||
          !statSync(filePath).isFile()
        ) {
          next()
          return
        }
        response.writeHead(200, {
          'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
        })
        createReadStream(filePath).pipe(response)
      })
    },
  }
}

export default defineConfig({
  plugins: [reactRouter(), tailwindcss(), serveUploads()],
})
