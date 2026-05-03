type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() < entry.expiresAt) return entry.value

  const value = await fn()
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

export const TTL = {
  EBAY_COMPS: 15 * 60 * 1000,       // 15 min — real transaction prices change fast
  TCGPLAYER: 6 * 60 * 60 * 1000,    // 6 h
  PRICECHARTING: 12 * 60 * 60 * 1000, // 12 h
} as const
