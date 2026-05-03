export class EbayConfigError extends Error {
  constructor() {
    super("eBay API keys are not configured. See docs/SETUP.md → eBay Browse API.")
    this.name = "EbayConfigError"
  }
}

interface EbayTokenResponse {
  access_token: string
  expires_in: number
}

interface EbayItemSummary {
  itemId: string
  title: string
  price: { value: string; currency: string }
  itemWebUrl: string
  image?: { imageUrl: string }
  seller?: { username: string; feedbackScore: number; feedbackPercentage: string }
  shippingOptions?: { shippingCost?: { value: string } }[]
  itemEndDate?: string
  condition?: string
}

interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[]
  total?: number
}

export interface EbayListing {
  externalId: string
  title: string
  price: number
  url: string
  imageUrl: string | null
  sellerName: string | null
  sellerFeedbackScore: number | null
  sellerFeedbackPercent: number | null
  shippingCost: number | null
  endsAt: string | null
  condition: string | null
  rawData: EbayItemSummary
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  const appId = process.env.EBAY_APP_ID
  const secret = process.env.EBAY_CLIENT_SECRET
  if (!appId || !secret) throw new EbayConfigError()

  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const credentials = Buffer.from(`${appId}:${secret}`).toString("base64")
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`eBay OAuth failed: ${res.status} ${body}`)
  }

  const data: EbayTokenResponse = await res.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export async function searchEbay(
  query: string,
  options: { limit?: number; minPrice?: number; maxPrice?: number } = {}
): Promise<EbayListing[]> {
  if (!process.env.EBAY_APP_ID || !process.env.EBAY_CLIENT_SECRET) throw new EbayConfigError()

  const token = await getAccessToken()
  const { limit = 20, minPrice, maxPrice } = options

  const params = new URLSearchParams({
    q: `${query} pokemon card`,
    limit: String(limit),
    sort: "newlyListed",
    "fieldgroups": "EXTENDED",
  })
  if (minPrice) params.set("price", "[" + minPrice + "..]")
  if (maxPrice) params.set("price", "[.." + maxPrice + "]")

  const res = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
      next: { revalidate: 300 },
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`eBay search failed: ${res.status} ${body}`)
  }

  const data: EbaySearchResponse = await res.json()
  return (data.itemSummaries ?? []).map((item) => ({
    externalId: item.itemId,
    title: item.title,
    price: parseFloat(item.price.value),
    url: item.itemWebUrl,
    imageUrl: item.image?.imageUrl ?? null,
    sellerName: item.seller?.username ?? null,
    sellerFeedbackScore: item.seller?.feedbackScore ?? null,
    sellerFeedbackPercent: item.seller?.feedbackPercentage
      ? parseFloat(item.seller.feedbackPercentage)
      : null,
    shippingCost: item.shippingOptions?.[0]?.shippingCost?.value
      ? parseFloat(item.shippingOptions[0].shippingCost!.value)
      : null,
    endsAt: item.itemEndDate ?? null,
    condition: item.condition ?? null,
    rawData: item,
  }))
}
