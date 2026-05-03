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

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000

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

export async function searchCard(
  cardName: string,
  setName?: string
): Promise<PriceChartingProduct | null> {
  const apiKey = getApiKey()
  const cacheKey = `${cardName}:${setName ?? ""}`

  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) return cached.value

  const query = setName ? `${cardName} ${setName}` : cardName
  const url = `https://www.pricecharting.com/api/products?q=${encodeURIComponent(query)}&id=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    searchCache.set(cacheKey, { value: null, expiresAt: Date.now() + CACHE_TTL_MS })
    return null
  }

  const data = await res.json()
  const products: PriceChartingProduct[] = data.products ?? []
  const result = products[0] ?? null

  searchCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS })
  return result
}

export async function getProductPrices(productId: string): Promise<PriceChartingPrices | null> {
  const apiKey = getApiKey()

  const cached = productCache.get(productId)
  if (cached && Date.now() < cached.expiresAt) return cached.value

  const url = `https://www.pricecharting.com/api/product?id=${productId}&api_key=${apiKey}`
  const res = await fetch(url)

  if (!res.ok) {
    productCache.set(productId, { value: null, expiresAt: Date.now() + CACHE_TTL_MS })
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

  productCache.set(productId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS })
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
  const product = await searchCard(cardName, options.setName)
  if (!product) return { price: null, productId: null }

  const prices = await getProductPrices(product.id)
  if (!prices) return { price: null, productId: product.id }

  if (options.graded) {
    const company = options.gradingCompany?.toUpperCase()
    const grade = options.grade

    if (company === "PSA" && grade) {
      const psaPrice = prices.gradePrices[grade]
      if (psaPrice != null) return { price: psaPrice, productId: product.id }
    }

    // Fallback to generic graded price for non-PSA or missing grade
    return { price: prices.gradedPrice, productId: product.id }
  }

  return { price: prices.loosePrice, productId: product.id }
}
