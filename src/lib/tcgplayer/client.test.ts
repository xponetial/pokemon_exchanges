import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}))

// Build a Supabase client stub for the fluent query chain (getCachedPrice)
function makeSupabaseWithCache(cachedRow: { price: number; raw_data: unknown } | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      cachedRow
        ? { data: cachedRow, error: null }
        : { data: null, error: { message: "not found" } }
    ),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

async function getSupabaseMock() {
  const { createAdminClient } = await import("@/lib/supabase/server")
  return createAdminClient as ReturnType<typeof vi.fn>
}

function setTCGPlayerKeys(present = true) {
  if (present) {
    process.env.TCGPLAYER_CLIENT_ID = "test-id"
    process.env.TCGPLAYER_CLIENT_SECRET = "test-secret"
  } else {
    delete process.env.TCGPLAYER_CLIENT_ID
    delete process.env.TCGPLAYER_CLIENT_SECRET
  }
}

const mockTokenResponse = {
  ok: true,
  json: async () => ({ access_token: "tok_test", expires_in: 3600 }),
}

const mockSearchResponse = {
  ok: true,
  json: async () => ({
    results: [{ productId: 1, name: "Charizard", cleanName: "Charizard", imageUrl: "", groupId: 1, url: "" }],
  }),
}

const mockPriceResponse = {
  ok: true,
  json: async () => ({
    results: [{ productId: 1, lowPrice: 40, midPrice: 55, highPrice: 70, marketPrice: 55, directLowPrice: null, subTypeName: "Normal" }],
  }),
}

describe("TCGplayer getMarketPrice — cache behavior", () => {
  beforeEach(() => {
    vi.resetModules()
    setTCGPlayerKeys(true)
  })

  it("returns cached data and skips fetch on cache hit", async () => {
    const sbMock = await getSupabaseMock()
    const cachedData = { productId: 1, name: "Charizard", setName: "Base Set", imageUrl: "", url: "", marketPrice: 250, midPrice: 200, lowPrice: 180 }
    sbMock.mockResolvedValue(makeSupabaseWithCache({ price: 250, raw_data: cachedData }))

    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { getMarketPrice } = await import("./client")
    const result = await getMarketPrice("Charizard", "Base Set")

    expect(result).toMatchObject({ marketPrice: 250, name: "Charizard" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("calls TCGplayer API on cache miss and stores result", async () => {
    const sbMock = await getSupabaseMock()
    sbMock.mockResolvedValue(makeSupabaseWithCache(null))

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce(mockSearchResponse)
      .mockResolvedValueOnce(mockPriceResponse)
    )

    const { getMarketPrice } = await import("./client")
    const result = await getMarketPrice("Charizard", "Base Set")

    expect(result?.marketPrice).toBe(55)
    expect(result?.name).toBe("Charizard")
  })

  it("returns null when TCGplayer returns no products", async () => {
    const sbMock = await getSupabaseMock()
    sbMock.mockResolvedValue(makeSupabaseWithCache(null))

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) })
    )

    const { getMarketPrice } = await import("./client")
    expect(await getMarketPrice("NonExistentCard")).toBeNull()
  })

  it("throws TCGPlayerConfigError when API keys are missing", async () => {
    setTCGPlayerKeys(false)
    const { getMarketPrice, TCGPlayerConfigError } = await import("./client")
    await expect(getMarketPrice("Charizard")).rejects.toBeInstanceOf(TCGPlayerConfigError)
  })

  it("uses Normal subtype price when multiple subtype prices exist", async () => {
    const sbMock = await getSupabaseMock()
    sbMock.mockResolvedValue(makeSupabaseWithCache(null))

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce(mockSearchResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { productId: 1, marketPrice: 30, midPrice: 28, lowPrice: 25, highPrice: 35, directLowPrice: null, subTypeName: "Holofoil" },
            { productId: 1, marketPrice: 55, midPrice: 50, lowPrice: 45, highPrice: 60, directLowPrice: null, subTypeName: "Normal" },
          ],
        }),
      })
    )

    const { getMarketPrice } = await import("./client")
    const result = await getMarketPrice("Charizard")
    expect(result?.marketPrice).toBe(55)
  })
})
