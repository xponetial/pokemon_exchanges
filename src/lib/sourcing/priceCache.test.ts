import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Supabase before any module imports
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}))

// Helper: build the fluent Supabase query chain used by getCachedPrice
function makeQueryChain(singleResult: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult),
  }
  return chain
}

// Helper: build a client stub for setCachedPrice (from → upsert)
function makeUpsertClient(upsertResult = { error: null }) {
  const upsert = vi.fn().mockResolvedValue(upsertResult)
  return { from: vi.fn().mockReturnValue({ upsert }) }
}

async function getSupabaseMock() {
  const { createAdminClient } = await import("@/lib/supabase/server")
  return createAdminClient as ReturnType<typeof vi.fn>
}

describe("buildCacheKey", () => {
  it("lowercases and hyphenates the card name", async () => {
    const { buildCacheKey } = await import("./priceCache")
    expect(buildCacheKey("Charizard Base Set")).toBe("charizard-base-set")
  })

  it("appends set name when provided", async () => {
    const { buildCacheKey } = await import("./priceCache")
    expect(buildCacheKey("Charizard", { setName: "Base Set" })).toBe("charizard|base-set")
  })

  it("appends grading company and grade when graded=true", async () => {
    const { buildCacheKey } = await import("./priceCache")
    const key = buildCacheKey("Charizard", {
      setName: "Base Set",
      graded: true,
      gradingCompany: "PSA",
      grade: "10",
    })
    expect(key).toBe("charizard|base-set|psa|10")
  })

  it("omits grading info when graded=false", async () => {
    const { buildCacheKey } = await import("./priceCache")
    const key = buildCacheKey("Charizard", {
      graded: false,
      gradingCompany: "PSA",
      grade: "10",
    })
    expect(key).toBe("charizard")
  })

  it("is case-insensitive and trims whitespace", async () => {
    const { buildCacheKey } = await import("./priceCache")
    expect(buildCacheKey("  PIKACHU  ")).toBe("pikachu")
  })
})

describe("getCachedPrice", () => {
  beforeEach(() => vi.resetModules())

  it("returns null when no row found", async () => {
    const mock = await getSupabaseMock()
    const chain = makeQueryChain({ data: null, error: { message: "not found" } })
    mock.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) })

    const { getCachedPrice } = await import("./priceCache")
    const result = await getCachedPrice("charizard", "tcgplayer")
    expect(result).toBeNull()
  })

  it("returns price and rawData when a valid row is found", async () => {
    const mock = await getSupabaseMock()
    const chain = makeQueryChain({
      data: { price: 250, raw_data: { marketPrice: 250, name: "Charizard" } },
      error: null,
    })
    mock.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) })

    const { getCachedPrice } = await import("./priceCache")
    const result = await getCachedPrice("charizard", "tcgplayer")

    expect(result).not.toBeNull()
    expect(result?.price).toBe(250)
    expect(result?.rawData).toMatchObject({ marketPrice: 250, name: "Charizard" })
  })

  it("returns null when createAdminClient throws", async () => {
    const mock = await getSupabaseMock()
    mock.mockRejectedValue(new Error("connection failed"))

    const { getCachedPrice } = await import("./priceCache")
    // Should not throw — cache errors are swallowed
    const result = await getCachedPrice("charizard", "tcgplayer")
    expect(result).toBeNull()
  })
})

describe("setCachedPrice", () => {
  beforeEach(() => vi.resetModules())

  it("upserts with tcgplayer TTL of 6 hours", async () => {
    const mock = await getSupabaseMock()
    const client = makeUpsertClient()
    mock.mockResolvedValue(client)

    const before = Date.now()
    const { setCachedPrice } = await import("./priceCache")
    await setCachedPrice("charizard", "tcgplayer", 150, { marketPrice: 150 })

    const upsertFn = (client.from as ReturnType<typeof vi.fn>).mock.results[0].value.upsert
    const payload = (upsertFn as ReturnType<typeof vi.fn>).mock.calls[0][0]

    const expiresAt = new Date(payload.expires_at).getTime()
    const expectedExpiry = before + 6 * 60 * 60 * 1000
    expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000)
    expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000)
    expect(payload.source).toBe("tcgplayer")
    expect(payload.price).toBe(150)
  })

  it("upserts with pricecharting TTL of 12 hours", async () => {
    const mock = await getSupabaseMock()
    const client = makeUpsertClient()
    mock.mockResolvedValue(client)

    const before = Date.now()
    const { setCachedPrice } = await import("./priceCache")
    await setCachedPrice("charizard", "pricecharting", 50, { price: 50 })

    const upsertFn = (client.from as ReturnType<typeof vi.fn>).mock.results[0].value.upsert
    const payload = (upsertFn as ReturnType<typeof vi.fn>).mock.calls[0][0]

    const expiresAt = new Date(payload.expires_at).getTime()
    const expectedExpiry = before + 12 * 60 * 60 * 1000
    expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000)
    expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000)
  })

  it("upserts with ebay_comps TTL of 15 minutes", async () => {
    const mock = await getSupabaseMock()
    const client = makeUpsertClient()
    mock.mockResolvedValue(client)

    const before = Date.now()
    const { setCachedPrice } = await import("./priceCache")
    await setCachedPrice("charizard", "ebay_comps", 120, { avgPrice: 120 })

    const upsertFn = (client.from as ReturnType<typeof vi.fn>).mock.results[0].value.upsert
    const payload = (upsertFn as ReturnType<typeof vi.fn>).mock.calls[0][0]

    const expiresAt = new Date(payload.expires_at).getTime()
    const expectedExpiry = before + 15 * 60 * 1000
    expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000)
    expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000)
  })

  it("silently swallows upsert errors — never throws", async () => {
    const mock = await getSupabaseMock()
    mock.mockRejectedValue(new Error("DB down"))

    const { setCachedPrice } = await import("./priceCache")
    await expect(setCachedPrice("charizard", "tcgplayer", 100, {})).resolves.toBeUndefined()
  })
})

describe("withCache", () => {
  beforeEach(() => vi.resetModules())

  it("returns cached price and does not call fetcher on cache hit", async () => {
    const mock = await getSupabaseMock()
    const chain = makeQueryChain({ data: { price: 300, raw_data: {} }, error: null })
    mock.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) })

    const fetcher = vi.fn()
    const { withCache } = await import("./priceCache")
    const price = await withCache("charizard", "tcgplayer", fetcher, (r: number) => r)

    expect(price).toBe(300)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("calls fetcher and stores result on cache miss", async () => {
    const mock = await getSupabaseMock()
    const upsert = vi.fn().mockResolvedValue({ error: null })
    // First call is getCachedPrice (returns null), second is setCachedPrice (upsert)
    mock.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
        upsert,
      }),
    })

    const fetcher = vi.fn().mockResolvedValue(42)
    const transform = (n: number) => n
    const { withCache } = await import("./priceCache")
    const price = await withCache("charizard", "tcgplayer", fetcher, transform)

    expect(price).toBe(42)
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it("returns null when fetcher returns null", async () => {
    const mock = await getSupabaseMock()
    const chain = makeQueryChain({ data: null, error: { message: "not found" } })
    mock.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) })

    const { withCache } = await import("./priceCache")
    const price = await withCache("charizard", "tcgplayer", () => Promise.resolve(null), () => null)

    expect(price).toBeNull()
  })
})
