import { describe, it, expect, vi, beforeEach } from "vitest"

// Must set env before importing the module so the key check sees it
const setApiKey = (key: string | undefined) => {
  if (key === undefined) {
    delete process.env.PRICECHARTING_API_KEY
  } else {
    process.env.PRICECHARTING_API_KEY = key
  }
}

describe("PriceCharting client", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    setApiKey("test-api-key")
  })

  describe("PriceChartingConfigError", () => {
    it("is thrown from searchCard when API key is missing", async () => {
      setApiKey(undefined)
      const { searchCard, PriceChartingConfigError } = await import("./client")
      await expect(searchCard("Charizard")).rejects.toBeInstanceOf(PriceChartingConfigError)
    })

    it("is thrown from getProductPrices when API key is missing", async () => {
      setApiKey(undefined)
      const { getProductPrices, PriceChartingConfigError } = await import("./client")
      await expect(getProductPrices("123")).rejects.toBeInstanceOf(PriceChartingConfigError)
    })

    it("is thrown from getCardPrice when API key is missing", async () => {
      setApiKey(undefined)
      const { getCardPrice, PriceChartingConfigError } = await import("./client")
      await expect(getCardPrice("Charizard")).rejects.toBeInstanceOf(PriceChartingConfigError)
    })
  })

  describe("searchCard", () => {
    it("returns the first product match", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            { id: "42", name: "Charizard", "console-name": "Pokemon" },
            { id: "99", name: "Charizard Holo", "console-name": "Pokemon" },
          ],
        }),
      }))

      const { searchCard } = await import("./client")
      const result = await searchCard("Charizard")
      expect(result?.id).toBe("42")
      expect(result?.name).toBe("Charizard")
    })

    it("returns null when no products found", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ products: [] }),
      }))

      const { searchCard } = await import("./client")
      expect(await searchCard("NoMatch")).toBeNull()
    })

    it("returns null on fetch error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
      const { searchCard } = await import("./client")
      expect(await searchCard("Charizard")).toBeNull()
    })

    it("includes setName in the query", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ products: [{ id: "1", name: "X", "console-name": "Y" }] }),
      })
      vi.stubGlobal("fetch", mockFetch)

      const { searchCard } = await import("./client")
      await searchCard("Charizard", "Base Set")

      const url: string = mockFetch.mock.calls[0][0]
      expect(url).toContain("Charizard")
      expect(url).toContain("Base%20Set")
    })
  })

  describe("getProductPrices", () => {
    it("converts cent prices to dollars", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "42",
          name: "Charizard",
          "console-name": "Pokemon",
          "loose-price": 5000,   // $50.00
          "graded-price": 20000, // $200.00
          "cib-price": 8000,     // $80.00
        }),
      }))

      const { getProductPrices } = await import("./client")
      const prices = await getProductPrices("42")

      expect(prices?.loosePrice).toBe(50)
      expect(prices?.gradedPrice).toBe(200)
      expect(prices?.cibPrice).toBe(80)
    })

    it("parses PSA grade-specific prices into gradePrices map", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "42",
          name: "Charizard",
          "console-name": "Pokemon",
          "loose-price": 0,
          "graded-price": 0,
          "cib-price": 0,
          "psa-10-price": 150000, // $1500.00
          "psa-9-price": 50000,   // $500.00
          "psa-8-price": 20000,   // $200.00
        }),
      }))

      const { getProductPrices } = await import("./client")
      const prices = await getProductPrices("42")

      expect(prices?.gradePrices["10"]).toBe(1500)
      expect(prices?.gradePrices["9"]).toBe(500)
      expect(prices?.gradePrices["8"]).toBe(200)
    })

    it("treats zero-cent prices as null", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "42",
          name: "Charizard",
          "console-name": "Pokemon",
          "loose-price": 0,
          "graded-price": 0,
          "cib-price": 0,
        }),
      }))

      const { getProductPrices } = await import("./client")
      const prices = await getProductPrices("42")

      expect(prices?.loosePrice).toBeNull()
      expect(prices?.gradedPrice).toBeNull()
    })

    it("returns null on fetch error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
      const { getProductPrices } = await import("./client")
      expect(await getProductPrices("42")).toBeNull()
    })
  })

  describe("getCardPrice", () => {
    const mockSearchResponse = {
      ok: true,
      json: async () => ({
        products: [{ id: "42", name: "Charizard", "console-name": "Pokemon" }],
      }),
    }

    const mockPriceResponse = {
      ok: true,
      json: async () => ({
        id: "42",
        name: "Charizard",
        "console-name": "Pokemon",
        "loose-price": 5000,    // $50
        "graded-price": 20000,  // $200
        "cib-price": 8000,
        "psa-10-price": 150000, // $1500
        "psa-9-price": 50000,   // $500
      }),
    }

    it("returns loose-price for raw cards", async () => {
      vi.stubGlobal("fetch", vi.fn()
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockPriceResponse))

      const { getCardPrice } = await import("./client")
      const result = await getCardPrice("Charizard", { graded: false })

      expect(result.price).toBe(50)
      expect(result.productId).toBe("42")
    })

    it("returns grade-specific psa price for PSA graded cards", async () => {
      vi.stubGlobal("fetch", vi.fn()
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockPriceResponse))

      const { getCardPrice } = await import("./client")
      const result = await getCardPrice("Charizard", {
        graded: true,
        gradingCompany: "PSA",
        grade: "10",
      })

      expect(result.price).toBe(1500)
    })

    it("falls back to graded-price for PSA when specific grade is missing", async () => {
      vi.stubGlobal("fetch", vi.fn()
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockPriceResponse))

      const { getCardPrice } = await import("./client")
      const result = await getCardPrice("Charizard", {
        graded: true,
        gradingCompany: "PSA",
        grade: "7", // not in mock data
      })

      expect(result.price).toBe(200) // graded-price
    })

    it("uses graded-price for non-PSA companies (BGS, CGC)", async () => {
      vi.stubGlobal("fetch", vi.fn()
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockPriceResponse))

      const { getCardPrice } = await import("./client")
      const result = await getCardPrice("Charizard", {
        graded: true,
        gradingCompany: "BGS",
        grade: "10",
      })

      expect(result.price).toBe(200) // graded-price, not psa-10-price
    })

    it("returns null price when product not found", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ products: [] }),
      }))

      const { getCardPrice } = await import("./client")
      const result = await getCardPrice("NonExistent Card")

      expect(result.price).toBeNull()
      expect(result.productId).toBeNull()
    })
  })
})
