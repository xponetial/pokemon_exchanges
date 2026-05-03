# Phase 2e — eBay Sold Comps

## Project Context

**Pokemon Exchanges** is a Pokémon card marketplace with a hidden admin sourcing engine.
The admin (Mitch) searches eBay for undervalued cards, scores them with AI, and buys them for resale.

**Tech stack:** Next.js 16 + TypeScript + Supabase (PostgreSQL) + OpenAI API + Tailwind CSS
**Working directory:** This file is in the project root. All source code is in `src/`.

---

## The Problem This Phase Solves

The current eBay client (`src/lib/ebay/client.ts`) searches **active listings** — cards currently for sale. But active listing prices tell you what sellers *want*, not what buyers *actually pay*.

**eBay sold comps** = recently completed/sold listings. These are real transaction prices and are the most accurate signal for what a card is worth right now.

This data feeds into the pricing aggregator (Phase 2c) as the `ebayCompsPrice` input.

---

## What Already Exists

### Relevant files to read before starting:
- `src/lib/ebay/client.ts` — existing eBay Browse API client. Has OAuth token logic. **Read this first** — sold comps uses the same auth pattern.
- `src/lib/sourcing/search.ts` — orchestrates all pricing enrichment, needs sold comps added
- `src/lib/sourcing/pricingAggregator.ts` — aggregator from Phase 2c, accepts `ebayCompsPrice: number | null`
- `src/lib/sourcing/priceCache.ts` — cache layer from Phase 2d, use it here with TTL of 15 minutes
- `src/lib/types/database.ts` — `ExternalListing` type

### Environment variables (already in `.env.local`):
- `EBAY_APP_ID` — same App ID used for active listings
- `EBAY_CLIENT_SECRET` — same secret

---

## What To Build

### 1. `src/lib/ebay/soldComps.ts` (new file)

**eBay Browse API endpoint for completed items:**
```
GET https://api.ebay.com/buy/browse/v1/item_summary/search
  ?q={query}
  &filter=buyingOptions:{FIXED_PRICE|AUCTION},itemLocationCountry:US
  &sort=endDateRecent
  &fieldgroups=EXTENDED
```

To get **sold** items specifically, use the eBay `buyingOptions` filter or the `completedItems` search endpoint.

Note: The eBay Browse API v1 doesn't directly expose sold/completed items — that's in the Finding API (`findCompletedItems`). Use the Finding API:

**Finding API endpoint:**
```
https://svcs.ebay.com/services/search/FindingService/v1
  ?OPERATION-NAME=findCompletedItems
  &SERVICE-VERSION=1.0.0
  &SECURITY-APPNAME={EBAY_APP_ID}
  &RESPONSE-DATA-FORMAT=JSON
  &keywords={query}
  &itemFilter(0).name=SoldItemsOnly
  &itemFilter(1).name=Condition
  &itemFilter(1).value=3000
  &sortOrder=EndTimeSoonest
  &paginationInput.entriesPerPage=10
```

Note: Finding API uses `EBAY_APP_ID` directly (no OAuth needed).

**Export:**
```ts
interface EbaySoldComp {
  title: string
  soldPrice: number
  soldAt: string       // ISO date string
  condition: string | null
  url: string
}

// Returns average sold price from recent comps, or null if not enough data
getSoldCompsPrice(
  query: string,        // normalized card name + grade e.g. "Charizard Base Set PSA 10"
  options?: { limit?: number }
): Promise<{ averagePrice: number | null; comps: EbaySoldComp[]; count: number }>
```

**Averaging logic:**
- Fetch last 10 sold listings
- Remove outliers (prices more than 2 standard deviations from mean)
- Return average of remaining prices
- If fewer than 3 comps found, return `averagePrice: null` (not enough data)

**Handle missing `EBAY_APP_ID` gracefully** — import and throw `EbayConfigError` from `src/lib/ebay/client.ts`.

### 2. Update `src/lib/sourcing/search.ts`

After normalization and TCGplayer/PriceCharting enrichment, call `getSoldCompsPrice()` using the normalized card name + grade as the query. Pass the result into `aggregatePrices()` as `ebayCompsPrice`.

Use the cache from Phase 2d (`withCache`) with a 15-minute TTL for sold comps (prices change faster than catalog data).

### 3. `src/app/api/sourcing/comps/route.ts` (new file)

A test/lookup endpoint:
```
GET /api/sourcing/comps?query=Charizard+Base+Set+PSA+10
Response: { averagePrice, comps[], count }
```

Admin-only.

### 4. Update deal detail page `src/app/(admin)/admin/sourcing/[id]/page.tsx`

In the Pricing section, add a "Recent eBay Sales" subsection showing the last 3–5 sold comps with price and date. This gives Mitch direct evidence for the fair value.

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

- [ ] `src/lib/ebay/soldComps.ts` exists with `getSoldCompsPrice()`
- [ ] Sold comps average price feeds into the pricing aggregator as `ebayCompsPrice`
- [ ] Result is cached with 15-minute TTL via Phase 2d cache
- [ ] `GET /api/sourcing/comps?query=...` returns comp data
- [ ] Deal detail page shows recent eBay sold prices
- [ ] Handles fewer than 3 comps gracefully (returns null, doesn't break scoring)
- [ ] Missing `EBAY_APP_ID` shows warning, doesn't crash
- [ ] `npm run build` passes with no type errors

---

## Testing

1. `npm install` then `npm run dev -- -p 3005`
2. Call `GET /api/sourcing/comps?query=Charizard+Base+Set+PSA+10`
3. Should return a list of recent sold prices + an average
4. Go to `/admin/sourcing`, search for a card, score it
5. Deal detail page should show "Recent eBay Sales" with real comp prices
6. Check that `aggregated_prices` table now has `ebay_comps_price` populated
