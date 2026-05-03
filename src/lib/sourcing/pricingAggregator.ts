export interface AggregatedPrice {
  fairValue: number
  confidenceScore: number
  sources: {
    tcgplayer: number | null
    pricecharting: number | null
    ebayComps: number | null
  }
  isGraded: boolean
  weights: Record<string, number>
}

export function aggregatePrices(options: {
  tcgplayerPrice: number | null
  pricechartingPrice: number | null
  ebayCompsPrice: number | null
  isGraded: boolean
}): AggregatedPrice {
  const { tcgplayerPrice, pricechartingPrice, ebayCompsPrice, isGraded } = options

  // Base weights per card type
  const baseWeights = isGraded
    ? { pricecharting: 0.5, ebayComps: 0.3, tcgplayer: 0.2 }
    : { tcgplayer: 0.5, pricecharting: 0.3, ebayComps: 0.2 }

  // Build available sources with their weights
  const available: Array<{ key: string; price: number; weight: number }> = []
  if (tcgplayerPrice != null) available.push({ key: "tcgplayer", price: tcgplayerPrice, weight: baseWeights.tcgplayer })
  if (pricechartingPrice != null) available.push({ key: "pricecharting", price: pricechartingPrice, weight: baseWeights.pricecharting })
  if (ebayCompsPrice != null) available.push({ key: "ebayComps", price: ebayCompsPrice, weight: baseWeights.ebayComps })

  // Fallback: no sources available
  if (available.length === 0) {
    return {
      fairValue: 0,
      confidenceScore: 0,
      sources: { tcgplayer: null, pricecharting: null, ebayComps: null },
      isGraded,
      weights: {},
    }
  }

  // Redistribute weights proportionally when sources are missing
  const totalWeight = available.reduce((sum, s) => sum + s.weight, 0)
  const normalizedWeights: Record<string, number> = {}
  for (const s of available) {
    normalizedWeights[s.key] = Math.round((s.weight / totalWeight) * 100) / 100
  }

  const fairValue =
    Math.round(
      available.reduce((sum, s) => sum + s.price * (s.weight / totalWeight), 0) * 100
    ) / 100

  // Confidence score
  let confidenceScore = 100
  if (tcgplayerPrice == null) confidenceScore -= 30
  if (pricechartingPrice == null) confidenceScore -= 30
  if (ebayCompsPrice == null) confidenceScore -= 20

  // Penalise if available sources disagree by > 30%
  if (available.length >= 2) {
    const prices = available.map((s) => s.price)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    if (minP > 0 && (maxP - minP) / minP > 0.3) {
      confidenceScore -= 20
    }
  }

  confidenceScore = Math.min(100, Math.max(0, confidenceScore))

  return {
    fairValue,
    confidenceScore,
    sources: {
      tcgplayer: tcgplayerPrice,
      pricecharting: pricechartingPrice,
      ebayComps: ebayCompsPrice,
    },
    isGraded,
    weights: normalizedWeights,
  }
}
