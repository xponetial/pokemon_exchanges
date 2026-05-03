import { createAdminClient } from "@/lib/supabase/server"

export type PriceSource = "tcgplayer" | "pricecharting" | "ebay_comps"

export interface CachedPrice {
  price: number | null
  rawData: unknown
}

const TTL_HOURS: Record<PriceSource, number> = {
  pricecharting: 12,
  tcgplayer: 6,
  ebay_comps: 0.25, // 15 minutes
}

export function buildCacheKey(
  cardName: string,
  options: {
    setName?: string
    graded?: boolean
    gradingCompany?: string
    grade?: string
  } = {}
): string {
  const parts = [cardName.toLowerCase().trim().replace(/\s+/g, "-")]
  if (options.setName) parts.push(options.setName.toLowerCase().trim().replace(/\s+/g, "-"))
  if (options.graded) {
    if (options.gradingCompany) parts.push(options.gradingCompany.toLowerCase())
    if (options.grade) parts.push(options.grade.toLowerCase())
  }
  return parts.join("|")
}

export async function getCachedPrice(
  cardKey: string,
  source: PriceSource
): Promise<CachedPrice | null> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("price, raw_data")
      .eq("card_key", cardKey)
      .eq("source", source)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !data) return null
    return { price: data.price as number | null, rawData: data.raw_data }
  } catch {
    return null
  }
}

export async function setCachedPrice(
  cardKey: string,
  source: PriceSource,
  price: number | null,
  rawData: unknown
): Promise<void> {
  try {
    const supabase = await createAdminClient()
    const expiresAt = new Date(Date.now() + TTL_HOURS[source] * 60 * 60 * 1000).toISOString()

    await supabase.from("price_snapshots").upsert(
      {
        card_key: cardKey,
        source,
        price,
        raw_data: rawData as Record<string, unknown>,
        expires_at: expiresAt,
      },
      { onConflict: "card_key,source" }
    )
  } catch {
    // Cache write failures are non-fatal — the live price was already returned
  }
}

// Convenience wrapper for callers that only need the price number.
// Checks DB cache first; on miss, calls fetcher and stores result.
export async function withCache<T>(
  cardKey: string,
  source: PriceSource,
  fetcher: () => Promise<T | null>,
  transform: (result: T) => number | null
): Promise<number | null> {
  const cached = await getCachedPrice(cardKey, source)
  if (cached !== null) return cached.price

  const result = await fetcher()
  if (result === null) return null

  const price = transform(result)
  await setCachedPrice(cardKey, source, price, result)
  return price
}
