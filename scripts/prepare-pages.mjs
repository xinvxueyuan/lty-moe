import { copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'

try {
  await access('dist/index.html', constants.F_OK)
  await copyFile('dist/index.html', 'dist/404.html')
  console.log('Prepared dist/404.html for GitHub Pages SPA fallback.')
} catch (error) {
  console.error('Unable to prepare GitHub Pages fallback:', error.message)
  process.exitCode = 1
}
