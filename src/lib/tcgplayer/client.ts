import { buildCacheKey, getCachedPrice, setCachedPrice } from "@/lib/sourcing/priceCache"

export class TCGPlayerConfigError extends Error {
  constructor() {
    super("TCGplayer API keys are not configured. See docs/SETUP.md → TCGplayer API.")
    this.name = "TCGPlayerConfigError"
  }
}

interface TCGPlayerTokenResponse {
  access_token: string
  expires_in: number
}

interface TCGPlayerProduct {
  productId: number
  name: string
  cleanName: string
  imageUrl: string
  groupId: number
  url: string
}

interface TCGPlayerPrice {
  productId: number
  lowPrice: number | null
  midPrice: number | null
  highPrice: number | null
  marketPrice: number | null
  directLowPrice: number | null
  subTypeName: string
}

export interface TCGPlayerMarketData {
  productId: number
  name: string
  setName: string
  imageUrl: string
  url: string
  marketPrice: number | null
  midPrice: number | null
  lowPrice: number | null
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  const clientId = process.env.TCGPLAYER_CLIENT_ID
  const clientSecret = process.env.TCGPLAYER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new TCGPlayerConfigError()

  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const res = await fetch("https://api.tcgplayer.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`TCGPlayer auth failed: ${res.status} ${body}`)
  }

  const data: TCGPlayerTokenResponse = await res.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

async function fetchMarketPrice(
  cardName: string,
  setName?: string
): Promise<TCGPlayerMarketData | null> {
  if (!process.env.TCGPLAYER_CLIENT_ID || !process.env.TCGPLAYER_CLIENT_SECRET) {
    throw new TCGPlayerConfigError()
  }

  const token = await getAccessToken()

  const searchParams = new URLSearchParams({
    productName: cardName,
    categoryId: "3", // Pokémon category
    limit: "5",
  })
  if (setName) searchParams.set("groupName", setName)

  const searchRes = await fetch(
    `https://api.tcgplayer.com/catalog/products?${searchParams}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    }
  )

  if (!searchRes.ok) return null

  const searchData = await searchRes.json()
  const products: TCGPlayerProduct[] = searchData.results ?? []
  if (products.length === 0) return null

  const product = products[0]

  const priceRes = await fetch(
    `https://api.tcgplayer.com/pricing/product/${product.productId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    }
  )

  if (!priceRes.ok) return null

  const priceData = await priceRes.json()
  const prices: TCGPlayerPrice[] = priceData.results ?? []
  const normal = prices.find((p) => p.subTypeName === "Normal") ?? prices[0]

  return {
    productId: product.productId,
    name: product.name,
    setName: setName ?? "",
    imageUrl: product.imageUrl,
    url: product.url,
    marketPrice: normal?.marketPrice ?? null,
    midPrice: normal?.midPrice ?? null,
    lowPrice: normal?.lowPrice ?? null,
  }
}

export async function getMarketPrice(
  cardName: string,
  setName?: string
): Promise<TCGPlayerMarketData | null> {
  const cardKey = buildCacheKey(cardName, { setName })

  const cached = await getCachedPrice(cardKey, "tcgplayer")
  if (cached !== null) return cached.rawData as TCGPlayerMarketData

  const result = await fetchMarketPrice(cardName, setName)
  await setCachedPrice(cardKey, "tcgplayer", result?.marketPrice ?? null, result)
  return result
}
