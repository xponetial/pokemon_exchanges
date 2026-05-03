# Phase 2d — Price Snapshots + Caching

## Project Context

**Pokemon Exchanges** is a Pokémon card marketplace with a hidden admin sourcing engine.
The admin (Mitch) searches eBay for undervalued cards, scores them with AI, and buys them for resale.

**Tech stack:** Next.js 16 + TypeScript + Supabase (PostgreSQL) + OpenAI API + Tailwind CSS
**Working directory:** This file is in the project root. All source code is in `src/`.

---

## The Problem This Phase Solves

Every time Mitch runs a search, the app hits TCGplayer and PriceCharting for every single listing. This:
- Slows down search results
- Risks hitting API rate limits
- Wastes money on API calls
- Throws away pricing history (we never know if a card is trending up or down)

**The fix:** Cache pricing responses in a `price_snapshots` Supabase table. On subsequent lookups, return the cached value if it's still fresh. Over time, this table becomes a price history database.

---

## What Already Exists

### Relevant files to read before starting:
- `src/lib/tcgplayer/client.ts` — makes uncached API calls, needs cache wrapper
- `src/lib/pricecharting/client.ts` — makes uncached API calls, needs cache wrapper (Phase 2b)
- `src/lib/supabase/server.ts` — `createAdminClient()` for DB writes
- `supabase/migrations/` — follow existing naming convention for new migration file
- `src/lib/types/database.ts` — add new table types here

---

## What To Build

### 1. Database migration

Name it: `20260502000004_price_snapshots.sql`

```sql
CREATE TABLE price_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key    text NOT NULL,         -- normalized lookup key e.g. "charizard|base-set|psa|10"
  source      text NOT NULL CHECK (source IN ('tcgplayer', 'pricecharting', 'ebay_comps')),
  price       numeric(10,2),
  raw_data    jsonb,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (card_key, source)
);

CREATE INDEX idx_price_snapshots_key    ON price_snapshots(card_key, source);
CREATE INDEX idx_price_snapshots_expiry ON price_snapshots(expires_at);

ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_price_snapshots" ON price_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

After writing this file run: `npx supabase db push --include-all`

### 2. `src/lib/sourcing/priceCache.ts` (new file)

A generic cache layer that wraps any pricing API call.

**TTLs (per PRD):**
- `pricecharting`: 12 hours
- `tcgplayer`: 6 hours
- `ebay_comps`: 15 minutes

**Exports:**
```ts
// Build a consistent cache key from card attributes
buildCacheKey(cardName: string, options?: {
  setName?: string
  graded?: boolean
  gradingCompany?: string
  grade?: string
}): string

// Get cached price if not expired
getCachedPrice(cardKey: string, source: PriceSource): Promise<CachedPrice | null>

// Save a price to the cache
setCachedPrice(cardKey: string, source: PriceSource, price: number, rawData: unknown): Promise<void>

// Wrap any pricing function with cache-aside logic
withCache<T>(
  cardKey: string,
  source: PriceSource,
  fetcher: () => Promise<T | null>,
  transform: (result: T) => number | null
): Promise<number | null>
```

### 3. Update `src/lib/tcgplayer/client.ts`

Wrap `getMarketPrice()` with `withCache()` from `priceCache.ts`. The function signature stays the same — caching is transparent to callers.

### 4. Update `src/lib/pricecharting/client.ts` (Phase 2b file)

Same — wrap `getCardPrice()` with `withCache()`.

### 5. Update `src/lib/types/database.ts`

Add the `price_snapshots` table type.

### 6. Add a cache stats display to `/admin` dashboard

On the admin dashboard page (`src/app/(admin)/admin/page.tsx`), add a small stat showing:
- Total cached prices
- Cache hit rate (approximate: snapshots not expired / total snapshots)

This gives Mitch visibility into whether the cache is working.

---

## Cache-Aside Pattern

```
Request price for "Charizard PSA 10"
  → Build cache key: "charizard|base-set|psa|10"
  → Check price_snapshots WHERE card_key = key AND source = 'tcgplayer' AND expires_at > now()
  → If found: return cached price
  → If not found: call TCGplayer API → save to price_snapshots with expiry → return price
```

---

## Definition of Done

- [ ] `price_snapshots` table exists in Supabase (migration applied)
- [ ] `src/lib/sourcing/priceCache.ts` exists with `withCache`, `getCachedPrice`, `setCachedPrice`, `buildCacheKey`
- [ ] TCGplayer and PriceCharting clients use cache — second search for same card skips API call
- [ ] `src/lib/types/database.ts` includes `price_snapshots` type
- [ ] Admin dashboard shows cache stats
- [ ] `npm run build` passes with no type errors

---

## Testing

1. `npm install` then `npm run dev -- -p 3004`
2. Go to `/admin/sourcing`, search for `"Charizard Base Set"` — note response time
3. Search again for the same term — should be faster (TCGplayer/PriceCharting calls skipped)
4. Check `price_snapshots` table in Supabase — should have rows with `expires_at` in the future
5. Manually set an `expires_at` in the past on a row — next search should refresh it
