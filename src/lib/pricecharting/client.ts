import { buildCacheKey, getCachedPrice, setCachedPrice } from "@/lib/sourcing/priceCache"

export class PriceChartingConfigError extends Error {
  constructor() {
    super("PriceCharting API key is not configured. See docs/SETUP.md → PriceCharting API.")
    this.name = "PriceChartingConfigError"
  }
}

interface PriceChartingProduct {
  id: string
  name: string
  "console-name": string
}

interface PriceChartingProductResponse {
  id: string
  name: string
  "console-name": string
  "loose-price": number
  "graded-price": number
  "cib-price": number
  [key: string]: unknown // psa-10-price, psa-9-price, etc.
}

export interface PriceChartingPrices {
  productId: string
  name: string
  consoleName: string
  loosePrice: number | null
  gradedPrice: number | null
  cibPrice: number | null
  gradePrices: Record<string, number>
}

// In-memory cache as a fast path within the same server instance
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const MEMORY_TTL_MS = 12 * 60 * 60 * 1000

const searchCache = new Map<string, CacheEntry<PriceChartingProduct | null>>()
const productCache = new Map<string, CacheEntry<PriceChartingPrices | null>>()

function centsToUsd(cents: number): number | null {
  if (typeof cents !== "number" || cents <= 0) return null
  return Math.round((cents / 100) * 100) / 100
}

function getApiKey(): string {
  const key = process.env.PRICECHARTING_API_KEY
  if (!key) throw new PriceChartingConfigError()
  return key
}

async function searchCard(
  cardName: string,
  setName?: string
): Promise<PriceChartingProduct | null> {
  const apiKey = getApiKey()
  const cacheKey = `${cardName}:${setName ?? ""}`

  const mem = searchCache.get(cacheKey)
  if (mem && Date.now() < mem.expiresAt) return mem.value

  const query = setName ? `${cardName} ${setName}` : cardName
  const url = `https://www.pricecharting.com/api/products?q=${encodeURIComponent(query)}&id=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    searchCache.set(cacheKey, { value: null, expiresAt: Date.now() + MEMORY_TTL_MS })
    return null
  }

  const data = await res.json()
  const products: PriceChartingProduct[] = data.products ?? []
  const result = products[0] ?? null

  searchCache.set(cacheKey, { value: result, expiresAt: Date.now() + MEMORY_TTL_MS })
  return result
}

async function getProductPrices(productId: string): Promise<PriceChartingPrices | null> {
  const apiKey = getApiKey()

  const mem = productCache.get(productId)
  if (mem && Date.now() < mem.expiresAt) return mem.value

  const url = `https://www.pricecharting.com/api/product?id=${productId}&api_key=${apiKey}`
  const res = await fetch(url)

  if (!res.ok) {
    productCache.set(productId, { value: null, expiresAt: Date.now() + MEMORY_TTL_MS })
    return null
  }

  const data: PriceChartingProductResponse = await res.json()

  const gradePrices: Record<string, number> = {}
  for (const [key, val] of Object.entries(data)) {
    const match = key.match(/^psa-(\d+(?:\.\d+)?)-price$/)
    if (match && typeof val === "number" && val > 0) {
      gradePrices[match[1]] = Math.round((val / 100) * 100) / 100
    }
  }

  const result: PriceChartingPrices = {
    productId: data.id,
    name: data.name,
    consoleName: data["console-name"],
    loosePrice: centsToUsd(data["loose-price"]),
    gradedPrice: centsToUsd(data["graded-price"]),
    cibPrice: centsToUsd(data["cib-price"]),
    gradePrices,
  }

  productCache.set(productId, { value: result, expiresAt: Date.now() + MEMORY_TTL_MS })
  return result
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
  const cardKey = buildCacheKey(cardName, options)

  // Check DB cache first (survives server restarts)
  const cached = await getCachedPrice(cardKey, "pricecharting")
  if (cached !== null) {
    const raw = cached.rawData as { price: number | null; productId: string | null } | null
    return raw ?? { price: cached.price, productId: null }
  }

  // Fetch live
  const product = await searchCard(cardName, options.setName)
  if (!product) {
    await setCachedPrice(cardKey, "pricecharting", null, { price: null, productId: null })
    return { price: null, productId: null }
  }

  const prices = await getProductPrices(product.id)
  if (!prices) {
    await setCachedPrice(cardKey, "pricecharting", null, { price: null, productId: product.id })
    return { price: null, productId: product.id }
  }

  let price: number | null = null

  if (options.graded) {
    const company = options.gradingCompany?.toUpperCase()
    const grade = options.grade

    if (company === "PSA" && grade) {
      price = prices.gradePrices[grade] ?? null
    }
    if (price === null) price = prices.gradedPrice
  } else {
    price = prices.loosePrice
  }

  const result = { price, productId: product.id }
  await setCachedPrice(cardKey, "pricecharting", price, result)
  return result
}
