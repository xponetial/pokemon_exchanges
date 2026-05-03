import { describe, it, expect } from "vitest"
import { aggregatePrices } from "./pricingAggregator"

describe("aggregatePrices — raw cards", () => {
  it("uses 50/30/20 weights when all sources present", () => {
    const result = aggregatePrices({
      tcgplayerPrice: 100,
      pricechartingPrice: 100,
      ebayCompsPrice: 100,
      isGraded: false,
    })
    expect(result.fairValue).toBe(100)
    expect(result.confidenceScore).toBe(100)
    expect(result.weights.tcgplayer).toBeCloseTo(0.5)
    expect(result.weights.pricecharting).toBeCloseTo(0.3)
    expect(result.weights.ebayComps).toBeCloseTo(0.2)
  })

  it("redistributes weights when eBay comps are missing", () => {
    const result = aggregatePrices({
      tcgplayerPrice: 100,
      pricechartingPrice: 100,
      ebayCompsPrice: null,
      isGraded: false,
    })
    // TCGplayer 0.5 / 0.8 = 0.625, PriceCharting 0.3 / 0.8 = 0.375
    expect(result.fairValue).toBe(100)
    expect(result.confidenceScore).toBe(80) // -20 for missing eBay comps
    expect(result.weights.ebayComps).toBeUndefined()
  })

  it("redistributes weights when only TCGplayer is present", () => {
    const result = aggregatePrices({
      tcgplayerPrice: 200,
      pricechartingPrice: null,
      ebayCompsPrice: null,
      isGraded: false,
    })
    expect(result.fairValue).toBe(200)
    expect(result.confidenceScore).toBe(50) // -30 PriceCharting, -20 eBay comps
    expect(result.weights.tcgplayer).toBe(1)
  })

  it("deducts 20 points when sources disagree by more than 30%", () => {
    // 100 vs 150 = 33% spread — should trigger disagreement penalty
    const result = aggregatePrices({
      tcgplayerPrice: 100,
      pricechartingPrice: 150,
      ebayCompsPrice: null,
      isGraded: false,
    })
    expect(result.confidenceScore).toBe(60) // 100 - 20 (eBay missing) - 20 (disagreement)
  })

  it("does not deduct disagreement penalty when spread is within 30%", () => {
    // 100 vs 125 = 25% spread — no penalty
    const result = aggregatePrices({
      tcgplayerPrice: 100,
      pricechartingPrice: 125,
      ebayCompsPrice: null,
      isGraded: false,
    })
    expect(result.confidenceScore).toBe(80) // 100 - 20 (eBay missing) only
  })
})

describe("aggregatePrices — graded cards", () => {
  it("uses 50/30/20 graded weights (PriceCharting anchor) when all sources present", () => {
    const result = aggregatePrices({
      tcgplayerPrice: 100,
      pricechartingPrice: 100,
      ebayCompsPrice: 100,
      isGraded: true,
    })
    expect(result.fairValue).toBe(100)
    expect(result.confidenceScore).toBe(100)
    expect(result.weights.pricecharting).toBeCloseTo(0.5)
    expect(result.weights.ebayComps).toBeCloseTo(0.3)
    expect(result.weights.tcgplayer).toBeCloseTo(0.2)
  })

  it("produces correct weighted fair value for graded card with two sources", () => {
    // PriceCharting 0.5, TCGplayer 0.2 → normalized: PC = 0.5/0.7, TCG = 0.2/0.7
    const result = aggregatePrices({
      tcgplayerPrice: 200,
      pricechartingPrice: 300,
      ebayCompsPrice: null,
      isGraded: true,
    })
    const expected = Math.round((300 * (0.5 / 0.7) + 200 * (0.2 / 0.7)) * 100) / 100
    expect(result.fairValue).toBe(expected)
    // -20 eBay comps missing, -20 disagreement (300 vs 200 = 50% spread > 30%)
    expect(result.confidenceScore).toBe(60)
  })
})

describe("aggregatePrices — edge cases", () => {
  it("returns zero fair value and zero confidence when no sources", () => {
    const result = aggregatePrices({
      tcgplayerPrice: null,
      pricechartingPrice: null,
      ebayCompsPrice: null,
      isGraded: false,
    })
    expect(result.fairValue).toBe(0)
    expect(result.confidenceScore).toBe(0)
    expect(result.weights).toEqual({})
  })

  it("clamps confidence score to 0 minimum", () => {
    // All missing + disagreement can't push below 0
    const result = aggregatePrices({
      tcgplayerPrice: null,
      pricechartingPrice: null,
      ebayCompsPrice: null,
      isGraded: false,
    })
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
    expect(result.confidenceScore).toBeLessThanOrEqual(100)
  })

  it("exposes all sources in result regardless of nulls", () => {
    const result = aggregatePrices({
      tcgplayerPrice: 50,
      pricechartingPrice: null,
      ebayCompsPrice: null,
      isGraded: false,
    })
    expect(result.sources.tcgplayer).toBe(50)
    expect(result.sources.pricecharting).toBeNull()
    expect(result.sources.ebayComps).toBeNull()
  })
})
