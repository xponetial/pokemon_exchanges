# Phase 2c — Pricing Aggregator + Confidence Score

## Project Context

**Pokemon Exchanges** is a Pokémon card marketplace with a hidden admin sourcing engine.
The admin (Mitch) searches eBay for undervalued cards, scores them with AI, and buys them for resale.

**Tech stack:** Next.js 16 + TypeScript + Supabase (PostgreSQL) + OpenAI API + Tailwind CSS
**Working directory:** This file is in the project root. All source code is in `src/`.

---

## The Problem This Phase Solves

Right now `market_price` on an external listing is just whatever TCGplayer (or PriceCharting from Phase 2b) returned last. There's no blending of sources, no weighting by reliability, and no signal to Mitch about how trustworthy that price is.

This phase introduces:
1. A **weighted fair value formula** that blends multiple pricing sources
2. A **confidence score** (0–100) that tells Mitch how much to trust the fair value

---

## What Already Exists

### Relevant files to read before starting:
- `src/lib/tcgplayer/client.ts` — TCGplayer pricing
- `src/lib/pricecharting/client.ts` — PriceCharting pricing (built in Phase 2b — read it)
- `src/lib/openai/scoring.ts` — currently receives `market_price` as a single number, needs updating
- `src/lib/sourcing/search.ts` — orchestrates all enrichment, needs to call aggregator
- `src/lib/types/database.ts` — `external_listings` and `deal_scores` tables
- `supabase/migrations/` — follow existing migration file naming convention

---

## What To Build

### 1. `src/lib/sourcing/pricingAggregator.ts` (new file)

**Weighted fair value formula:**

For **Raw (ungraded) cards:**
```
fairValue = (TCGplayer * 0.50) + (PriceCharting * 0.30) + (eBay comps * 0.20)
```

For **Graded cards:**
```
fairValue = (PriceCharting * 0.50) + (eBay comps * 0.30) + (PSA rarity modifier * 0.20)
```

Note: eBay comps (Phase 2e) and PSA modifier (deferred) may not be available yet — handle missing sources gracefully by redistributing weights.

**Confidence score logic:**
- Start at 100
- Each missing source deducts points: TCGplayer missing = -30, PriceCharting missing = -30, eBay comps missing = -20
- If sources disagree by more than 30%: deduct 20 points
- Minimum 0, maximum 100

**Export:**
```ts
interface AggregatedPrice {
  fairValue: number
  confidenceScore: number          // 0–100
  sources: {
    tcgplayer: number | null
    pricecharting: number | null
    ebayComps: number | null
  }
  isGraded: boolean
  weights: Record<string, number>  // actual weights used
}

aggregatePrices(options: {
  tcgplayerPrice: number | null
  pricechartingPrice: number | null
  ebayCompsPrice: number | null
  isGraded: boolean
}): AggregatedPrice
```

### 2. Database migration (new file in `supabase/migrations/`)

Name it: `20260502000003_aggregated_prices.sql`

```sql
CREATE TABLE aggregated_prices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_listing_id uuid REFERENCES external_listings(id) ON DELETE CASCADE,
  fair_value        numeric(10,2) NOT NULL,
  confidence_score  integer NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  tcgplayer_price   numeric(10,2),
  pricecharting_price numeric(10,2),
  ebay_comps_price  numeric(10,2),
  is_graded         boolean DEFAULT false,
  weights           jsonb,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (external_listing_id)
);

ALTER TABLE aggregated_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_aggregated_prices" ON aggregated_prices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

After writing this file, run: `npx supabase db push --include-all`

### 3. Update `src/lib/types/database.ts`

Add the `aggregated_prices` table type following the same pattern as existing tables.

### 4. Update `src/lib/sourcing/search.ts`

After all pricing sources are fetched, call `aggregatePrices()` and:
- Save result to `aggregated_prices` table
- Use `fairValue` as the `market_price` on `external_listings` (replaces raw TCGplayer price)
- Pass `confidenceScore` to OpenAI scoring

### 5. Update `src/lib/openai/scoring.ts`

Add `confidenceScore` to the prompt so the AI knows how reliable the market price is:

```
Market Price: $245 (confidence: 88/100 — based on TCGplayer + PriceCharting)
```

### 6. Update `src/app/(admin)/admin/sourcing/[id]/page.tsx`

Show the confidence score and source breakdown on the deal detail page. Add a small section under Pricing showing which sources contributed and their weights.

---

## Definition of Done

- [ ] `src/lib/sourcing/pricingAggregator.ts` exists with `aggregatePrices()`
- [ ] `aggregated_prices` table exists in Supabase (migration applied)
- [ ] `src/lib/types/database.ts` includes `AggregatedPrice` table type
- [ ] Every scored listing has an `aggregated_prices` row
- [ ] `market_price` on `external_listings` now reflects the weighted fair value
- [ ] Deal detail page shows confidence score + source breakdown
- [ ] Handles any combination of missing sources without crashing
- [ ] `npm run build` passes with no type errors

---

## Testing

1. `npm install` then `npm run dev -- -p 3003`
2. Go to `/admin/sourcing`, search for `"Charizard PSA 10"`
3. Score a deal — check the deal detail page at `/admin/sourcing/[id]`
4. Should see: fair value, confidence score, which sources contributed
5. Check `aggregated_prices` table in Supabase dashboard — should have a row per scored listing
