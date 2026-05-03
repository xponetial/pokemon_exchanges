# Phase 2b — PriceCharting Integration

## Project Context

**Pokemon Exchanges** is a Pokémon card marketplace with a hidden admin sourcing engine.
The admin (Mitch) searches eBay for undervalued cards, scores them with AI, and buys them for resale.

**Tech stack:** Next.js 16 + TypeScript + Supabase (PostgreSQL) + OpenAI API + Tailwind CSS
**Working directory:** This file is in the project root. All source code is in `src/`.

---

## The Problem This Phase Solves

Right now the only pricing source is TCGplayer, which is good for raw/ungraded cards but weak for graded cards (PSA, BGS, CGC). TCGplayer doesn't track actual sold prices — it tracks listing prices.

**PriceCharting** tracks real historical sold prices across eBay, and includes PSA population data for rarity adjustments. It's the industry standard anchor for graded card valuations.

---

## What Already Exists

### Relevant files to read before starting:
- `src/lib/tcgplayer/client.ts` — existing API client pattern to follow exactly
- `src/lib/sourcing/search.ts` — where pricing enrichment happens, needs PriceCharting added
- `src/lib/types/database.ts` — `ExternalListing` type, `external_listings` table schema
- `src/lib/openai/scoring.ts` — OpenAI scoring receives `market_price` — this phase improves that input
- `docs/SETUP.md` — add PriceCharting to this doc when done

### Environment variables to add to `.env.local` and `.env.example`:
```
PRICECHARTING_API_KEY=
```

---

## What To Build

### 1. `src/lib/pricecharting/client.ts` (new file)

PriceCharting has a simple REST API: https://www.pricecharting.com/api/products

**Key endpoints:**
- Search: `GET https://www.pricecharting.com/api/products?q={cardName}&id={apiKey}`
- Product prices: `GET https://www.pricecharting.com/api/product?id={productId}&api_key={apiKey}`

**Price fields returned (all in cents — divide by 100):**
- `loose-price` — raw/ungraded market price
- `graded-price` — generic graded price
- `psa-10-price`, `psa-9-price`, `psa-8-price` etc. — grade-specific prices
- `cib-price` — complete in box

**Export a `PriceChartingConfigError` class and these functions:**

```ts
// Search for a card and return the best match
searchCard(cardName: string, setName?: string): Promise<PriceChartingProduct | null>

// Get full pricing data for a known product ID
getProductPrices(productId: string): Promise<PriceChartingPrices | null>

// Convenience: get the right price for a given condition/grade
getCardPrice(cardName: string, options: {
  setName?: string
  graded?: boolean
  gradingCompany?: string  // "PSA", "BGS", "CGC"
  grade?: string           // "10", "9.5", "9" etc
}): Promise<{ price: number | null; productId: string | null }>
```

**Handle missing API key gracefully** — same pattern as `src/lib/tcgplayer/client.ts`. Export a `PriceChartingConfigError` class.

**Cache tokens in memory** — PriceCharting doesn't use OAuth but rate-limit by caching results (Map<string, result> with a timestamp check, TTL 12 hours).

### 2. Update `src/lib/sourcing/search.ts`

After TCGplayer enrichment, also call PriceCharting and store the result. 

For graded cards (`grading_company` is not null): prefer PriceCharting price as `market_price`.
For raw cards: keep TCGplayer as `market_price`, store PriceCharting as secondary.

Update the `external_listings` DB row with the best available `market_price`.

### 3. Update `docs/SETUP.md`

Add a **PriceCharting** section following the same format as other services:
- What it does
- Dashboard URL: https://www.pricecharting.com/api
- Where to get the API key
- Variable name: `PRICECHARTING_API_KEY`
- Notes: free tier available, rate limits

### 4. Update `.env.example`

Add `PRICECHARTING_API_KEY=` under the TCGplayer section.

---

## Auth Pattern (copy from existing routes)

```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
```

---

## Definition of Done

- [ ] `src/lib/pricecharting/client.ts` exists with `searchCard`, `getProductPrices`, `getCardPrice`
- [ ] `PRICECHARTING_API_KEY` missing returns `PriceChartingConfigError` gracefully
- [ ] Graded card listings use PriceCharting price as `market_price` in the DB
- [ ] `docs/SETUP.md` updated with PriceCharting section
- [ ] `.env.example` updated with `PRICECHARTING_API_KEY`
- [ ] `npm run build` passes with no type errors

---

## Testing

1. `npm install` then `npm run dev -- -p 3002`
2. Add `PRICECHARTING_API_KEY` to `.env.local` (get a free key at pricecharting.com/api)
3. Go to `/admin/sourcing`, search for `"Charizard PSA 10"`
4. Check `external_listings` in Supabase — graded results should have `market_price` populated from PriceCharting
5. Without the API key, the yellow warning banner should appear and raw TCGplayer prices should still work
