import { copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'

try {
  const clientDirectory = 'build/client'
  const fallback = `${clientDirectory}/__spa-fallback.html`
  const index = `${clientDirectory}/index.html`
  await access(fallback, constants.F_OK).catch(() => access(index, constants.F_OK))
  await copyFile(fallback, `${clientDirectory}/404.html`).catch(() =>
    copyFile(index, `${clientDirectory}/404.html`),
  )
  console.log('Prepared build/client/404.html for GitHub Pages SPA fallback.')
} catch (error) {
  console.error('Unable to prepare GitHub Pages fallback:', error.message)
  process.exitCode = 1
}
