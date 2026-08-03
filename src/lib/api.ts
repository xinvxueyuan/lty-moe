import type { Work } from '../data/types'

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Response(null, { status: response.status, statusText: response.statusText })
  }
  return response.json() as Promise<T>
}

export async function fetchWorks(): Promise<Work[]> {
  const response = await fetch('/api/works', { credentials: 'same-origin' })
  const data = await readJson<{ works: Work[] }>(response)
  return data.works
}

export async function fetchWork(id: string): Promise<Work> {
  const response = await fetch(`/api/works/${encodeURIComponent(id)}`, {
    credentials: 'same-origin',
  })
  const data = await readJson<{ work: Work }>(response)
  return data.work
}
