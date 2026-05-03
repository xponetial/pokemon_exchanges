import { searchEbay, EbayConfigError } from "@/lib/ebay/client"
import { getSoldCompsPrice } from "@/lib/ebay/soldComps"
import { getCardPrice, PriceChartingConfigError } from "@/lib/pricecharting/client"
import { getMarketPrice, TCGPlayerConfigError } from "@/lib/tcgplayer/client"
import { normalizeTitle } from "@/lib/sourcing/normalization"
import { aggregatePrices } from "@/lib/sourcing/pricingAggregator"
import { buildCacheKey, withCache } from "@/lib/sourcing/priceCache"
import { createAdminClient } from "@/lib/supabase/server"
import type { ExternalListing } from "@/lib/types/database"

export interface SearchResult {
  saved: ExternalListing[]
  skipped: number
  errors: string[]
  missingKeys: string[]
}

export async function searchAndSave(
  query: string,
  options: { limit?: number } = {}
): Promise<SearchResult> {
  const supabase = await createAdminClient()
  const errors: string[] = []
  const missingKeys: string[] = []
  let ebayResults: Awaited<ReturnType<typeof searchEbay>> = []

  try {
    ebayResults = await searchEbay(query, { limit: options.limit ?? 20 })
  } catch (err) {
    if (err instanceof EbayConfigError) {
      missingKeys.push("eBay")
    } else {
      errors.push(`eBay: ${(err as Error).message}`)
    }
  }

  const rows = ebayResults.map((item) => ({
    source: "ebay" as const,
    external_id: item.externalId,
    title: item.title,
    price: item.price,
    url: item.url,
    image_url: item.imageUrl,
    seller_name: item.sellerName,
    seller_feedback_score: item.sellerFeedbackScore,
    seller_feedback_percent: item.sellerFeedbackPercent,
    shipping_cost: item.shippingCost,
    ends_at: item.endsAt,
    condition: item.condition,
    raw_data: item.rawData as unknown as Record<string, unknown>,
    status: "new" as const,
  }))

  if (rows.length === 0) {
    return { saved: [], skipped: 0, errors, missingKeys }
  }

  const { data: saved, error: upsertError } = await supabase
    .from("external_listings")
    .upsert(rows, { onConflict: "source,external_id", ignoreDuplicates: true })
    .select()

  if (upsertError) errors.push(`DB upsert: ${upsertError.message}`)

  const savedRows = (saved ?? []) as ExternalListing[]
  const skipped = rows.length - savedRows.length

  // Normalize titles for listings that have no card_name yet
  for (const row of savedRows) {
    if (row.card_name) continue
    try {
      const normalized = await normalizeTitle(row.title)
      if (normalized.card_name) {
        await supabase
          .from("external_listings")
          .update({
            card_name: normalized.card_name,
            set_name: normalized.set_name,
            card_number: normalized.card_number,
            condition: normalized.condition,
            grading_company: normalized.grading_company,
            grade: normalized.grade,
          })
          .eq("id", row.id)
        row.card_name = normalized.card_name
        row.set_name = normalized.set_name
        row.card_number = normalized.card_number
        row.condition = normalized.condition
        row.grading_company = normalized.grading_company
        row.grade = normalized.grade
      }
    } catch {
      // Non-fatal — continue without normalization
    }
  }

  // Enrich each listing with pricing from all sources
  for (const row of savedRows) {
    if (!row.card_name) continue

    const cardCacheKey = buildCacheKey(row.card_name, {
      setName: row.set_name ?? undefined,
      graded: Boolean(row.grading_company),
      gradingCompany: row.grading_company ?? undefined,
      grade: row.grade ?? undefined,
    })

    let tcgMarketPrice: number | null = null
    let priceChartingPrice: number | null = null
    let ebayCompsPrice: number | null = null

    try {
      tcgMarketPrice = await withCache(
        cardCacheKey,
        "tcgplayer",
        () => getMarketPrice(row.card_name!, row.set_name ?? undefined),
        (result) => result?.marketPrice ?? null
      )
    } catch (err) {
      if (err instanceof TCGPlayerConfigError) {
        if (!missingKeys.includes("TCGplayer")) missingKeys.push("TCGplayer")
      }
    }

    try {
      priceChartingPrice = await withCache(
        cardCacheKey,
        "pricecharting",
        () => getCardPrice(row.card_name!, {
          setName: row.set_name ?? undefined,
          graded: Boolean(row.grading_company),
          gradingCompany: row.grading_company ?? undefined,
          grade: row.grade ?? undefined,
        }),
        (result) => result.price
      )
    } catch (err) {
      if (err instanceof PriceChartingConfigError) {
        if (!missingKeys.includes("PriceCharting")) missingKeys.push("PriceCharting")
      }
    }

    try {
      const compsQuery = [
        row.card_name,
        row.set_name,
        row.grading_company && row.grade
          ? `${row.grading_company} ${row.grade}`
          : null,
      ]
        .filter(Boolean)
        .join(" ")

      ebayCompsPrice = await withCache(
        cardCacheKey,
        "ebay_comps",
        () => getSoldCompsPrice(compsQuery),
        (result) => result.averagePrice
      )
    } catch (err) {
      if (err instanceof EbayConfigError) {
        if (!missingKeys.includes("eBay")) missingKeys.push("eBay")
      }
    }

    const aggregated = aggregatePrices({
      tcgplayerPrice: tcgMarketPrice,
      pricechartingPrice: priceChartingPrice,
      ebayCompsPrice,
      isGraded: Boolean(row.grading_company),
    })

    if (aggregated.fairValue > 0) {
      const diff = ((aggregated.fairValue - row.price) / aggregated.fairValue) * 100
      await supabase
        .from("external_listings")
        .update({
          market_price: aggregated.fairValue,
          price_diff_percent: Math.round(diff * 100) / 100,
        })
        .eq("id", row.id)
      row.market_price = aggregated.fairValue
      row.price_diff_percent = Math.round(diff * 100) / 100

      await supabase.from("aggregated_prices").upsert(
        {
          external_listing_id: row.id,
          fair_value: aggregated.fairValue,
          confidence_score: aggregated.confidenceScore,
          tcgplayer_price: aggregated.sources.tcgplayer,
          pricecharting_price: aggregated.sources.pricecharting,
          ebay_comps_price: aggregated.sources.ebayComps,
          is_graded: aggregated.isGraded,
          weights: aggregated.weights,
        },
        { onConflict: "external_listing_id" }
      )
    }
  }

  return { saved: savedRows, skipped, errors, missingKeys }
}
