import type { Work } from '../data/types'
import {
  getCachedWork,
  getCachedWorks,
  invalidateWorksCache,
  setCachedWork,
  setCachedWorks,
} from './works-cache'

export { invalidateWorksCache }

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Response(null, { status: response.status, statusText: response.statusText })
  }
  return response.json() as Promise<T>
}

export async function fetchWorks(options: { force?: boolean } = {}): Promise<Work[]> {
  if (!options.force) {
    const cached = getCachedWorks()
    if (cached) return cached
  }
  const response = await fetch('/api/works', { credentials: 'same-origin' })
  const data = await readJson<{ works: Work[] }>(response)
  setCachedWorks(data.works)
  return data.works
}

export async function fetchWork(id: string, options: { force?: boolean } = {}): Promise<Work> {
  if (!options.force) {
    const cached = getCachedWork(id)
    if (cached) return cached
  }
  const response = await fetch(`/api/works/${encodeURIComponent(id)}`, {
    credentials: 'same-origin',
  })
  const data = await readJson<{ work: Work }>(response)
  setCachedWork(data.work)
  return data.work
}

export type UploadedImage = {
  url: string
  filename: string
  size: number
  contentType: string
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch('/api/images', {
    method: 'POST',
    body,
    credentials: 'same-origin',
  })
  return readJson<UploadedImage>(response)
}
