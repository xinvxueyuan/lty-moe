import type { Work } from '../data/types'

const WORKS_KEY = 'works:all'
const DEFAULT_TTL_MS = 60_000

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return Boolean(entry && entry.expiresAt > Date.now())
}

export function getCachedWorks(): Work[] | null {
  const entry = store.get(WORKS_KEY) as CacheEntry<Work[]> | undefined
  return isFresh(entry) ? entry.data : null
}

export function setCachedWorks(works: Work[], ttlMs = DEFAULT_TTL_MS): void {
  store.set(WORKS_KEY, { data: works, expiresAt: Date.now() + ttlMs })
  for (const work of works) {
    setCachedWork(work, ttlMs)
  }
}

export function getCachedWork(id: string): Work | null {
  const entry = store.get(`work:${id}`) as CacheEntry<Work> | undefined
  return isFresh(entry) ? entry.data : null
}

export function setCachedWork(work: Work, ttlMs = DEFAULT_TTL_MS): void {
  store.set(`work:${work.id}`, { data: work, expiresAt: Date.now() + ttlMs })
}

export function invalidateWorksCache(): void {
  store.clear()
}

export function primeWorksCacheFromList(works: Work[], ttlMs = DEFAULT_TTL_MS): void {
  setCachedWorks(works, ttlMs)
}
