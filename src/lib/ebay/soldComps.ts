import { EbayConfigError } from "@/lib/ebay/client"

export interface EbaySoldComp {
  title: string
  soldPrice: number
  soldAt: string
  condition: string | null
  url: string
}

export interface SoldCompsResult {
  averagePrice: number | null
  comps: EbaySoldComp[]
  count: number
}

interface FindingItem {
  title: string[]
  viewItemURL: string[]
  sellingStatus: { currentPrice: { __value__: string }[] }[]
  listingInfo: { endTime: string[] }[]
  condition?: { conditionDisplayName: string[] }[]
}

interface FindingResponse {
  findCompletedItemsResponse: {
    searchResult: { item?: FindingItem[] }[]
    ack: string[]
  }[]
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 3) return prices
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length
  const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length
  const stdDev = Math.sqrt(variance)
  return prices.filter((p) => Math.abs(p - mean) <= 2 * stdDev)
}

export async function getSoldCompsPrice(
  query: string,
  options: { limit?: number } = {}
): Promise<SoldCompsResult> {
  const appId = process.env.EBAY_APP_ID
  if (!appId) throw new EbayConfigError()

  const limit = options.limit ?? 10

  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "RESPONSE-DATA-FORMAT": "JSON",
    "keywords": `${query} pokemon card`,
    "itemFilter(0).name": "SoldItemsOnly",
    "itemFilter(0).value": "true",
    "itemFilter(1).name": "Condition",
    "itemFilter(1).value": "3000",
    "sortOrder": "EndTimeSoonest",
    "paginationInput.entriesPerPage": String(limit),
  })

  const res = await fetch(
    `https://svcs.ebay.com/services/search/FindingService/v1?${params}`,
    { next: { revalidate: 900 } }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`eBay Finding API failed: ${res.status} ${body}`)
  }

  const data: FindingResponse = await res.json()
  const response = data.findCompletedItemsResponse?.[0]
  const items = response?.searchResult?.[0]?.item ?? []

  const comps: EbaySoldComp[] = items
    .map((item) => {
      const rawPrice = item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__
      const soldPrice = rawPrice ? parseFloat(rawPrice) : NaN
      if (!isFinite(soldPrice) || soldPrice <= 0) return null

      return {
        title: item.title?.[0] ?? "",
        soldPrice,
        soldAt: item.listingInfo?.[0]?.endTime?.[0] ?? new Date().toISOString(),
        condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? null,
        url: item.viewItemURL?.[0] ?? "",
      } satisfies EbaySoldComp
    })
    .filter((c): c is EbaySoldComp => c !== null)

  if (comps.length < 3) {
    return { averagePrice: null, comps, count: comps.length }
  }

  const prices = comps.map((c) => c.soldPrice)
  const filtered = removeOutliers(prices)
  const averagePrice =
    filtered.length === 0
      ? null
      : Math.round((filtered.reduce((s, p) => s + p, 0) / filtered.length) * 100) / 100

  return { averagePrice, comps, count: comps.length }
}
