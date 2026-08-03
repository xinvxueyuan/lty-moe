import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const sourceExtensions = ['.ts', '.tsx', '.js', '.mjs', '.json']
const knownExt = /\.(?:ts|tsx|js|mjs|cjs|json|png|jpe?g|webp|gif|avif|svg)$/i

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !knownExt.test(specifier) &&
      context.parentURL
    ) {
      const parentDir = dirname(fileURLToPath(context.parentURL))
      for (const extension of sourceExtensions) {
        const candidate = join(parentDir, specifier + extension)
        if (existsSync(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context)
        }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(url)) {
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)}`,
        shortCircuit: true,
      }
    }
    return nextLoad(url, context)
  },
})
