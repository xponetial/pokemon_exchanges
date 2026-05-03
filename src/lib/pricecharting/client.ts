export class PriceChartingConfigError extends Error {
  constructor() {
    super("PriceCharting API key is not configured. See docs/SETUP.md -> PriceCharting API.")
    this.name = "PriceChartingConfigError"
  }
}

export interface PriceChartingProduct {
  id: string
  product_name: string
  console_name?: string
}

export interface PriceChartingPrices {
  id: string
  product_name?: string
  loosePrice: number | null
  gradedPrice: number | null
  cibPrice: number | null
  gradePrices: Record<string, number>
}

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const searchCache = new Map<string, CacheEntry<PriceChartingProduct | null>>()
const productCache = new Map<string, CacheEntry<PriceChartingPrices | null>>()

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + TWELVE_HOURS_MS })
}

function parseCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value / 100
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed / 100 : null
  }
  return null
}

function normalizeGrade(grade?: string): string | null {
  if (!grade) return null
  const cleaned = grade.trim().toUpperCase().replace(/^PSA\s+/, "").replace(/^BGS\s+/, "").replace(/^CGC\s+/, "")
  if (!cleaned) return null
  return cleaned.replace(".0", "")
}

export async function searchCard(
  cardName: string,
  setName?: string
): Promise<PriceChartingProduct | null> {
  const apiKey = process.env.PRICECHARTING_API_KEY
  if (!apiKey) throw new PriceChartingConfigError()

  const query = [cardName, setName].filter(Boolean).join(" ").trim()
  const cacheKey = query.toLowerCase()
  const cached = readCache(searchCache, cacheKey)
  if (cached !== null) return cached

  const params = new URLSearchParams({ q: query, id: apiKey })
  const res = await fetch(`https://www.pricecharting.com/api/products?${params}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    writeCache(searchCache, cacheKey, null)
    return null
  }

  const data = await res.json() as { products?: PriceChartingProduct[] }
  const products = data.products ?? []
  const best = products[0] ?? null
  writeCache(searchCache, cacheKey, best)
  return best
}

export async function getProductPrices(productId: string): Promise<PriceChartingPrices | null> {
  const apiKey = process.env.PRICECHARTING_API_KEY
  if (!apiKey) throw new PriceChartingConfigError()

  const cacheKey = String(productId)
  const cached = readCache(productCache, cacheKey)
  if (cached !== null) return cached

  const params = new URLSearchParams({ id: cacheKey, api_key: apiKey })
  const res = await fetch(`https://www.pricecharting.com/api/product?${params}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    writeCache(productCache, cacheKey, null)
    return null
  }

  const raw = await res.json() as Record<string, unknown>
  const gradePrices: Record<string, number> = {}

  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith("psa-") || !key.endsWith("-price")) continue
    const grade = key.replace("psa-", "").replace("-price", "")
    const parsed = parseCents(value)
    if (parsed !== null) gradePrices[grade] = parsed
  }

  const parsed: PriceChartingPrices = {
    id: String(raw.id ?? productId),
    product_name: typeof raw["product-name"] === "string" ? raw["product-name"] : undefined,
    loosePrice: parseCents(raw["loose-price"]),
    gradedPrice: parseCents(raw["graded-price"]),
    cibPrice: parseCents(raw["cib-price"]),
    gradePrices,
  }

  writeCache(productCache, cacheKey, parsed)
  return parsed
}

export async function getCardPrice(
  cardName: string,
  options: {
    setName?: string
    graded?: boolean
    gradingCompany?: string
    grade?: string
  } = {}
): Promise<{ price: number | null; productId: string | null }> {
  const product = await searchCard(cardName, options.setName)
  if (!product) return { price: null, productId: null }

  const prices = await getProductPrices(product.id)
  if (!prices) return { price: null, productId: product.id }

  if (options.graded) {
    const company = options.gradingCompany?.trim().toUpperCase()
    const grade = normalizeGrade(options.grade)

    if (company === "PSA" && grade) {
      const psaSpecific = prices.gradePrices[grade]
      if (typeof psaSpecific === "number") return { price: psaSpecific, productId: product.id }
    }

    return { price: prices.gradedPrice, productId: product.id }
  }

  return { price: prices.loosePrice, productId: product.id }
}
