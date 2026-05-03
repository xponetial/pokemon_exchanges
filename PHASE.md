# Phase 2a — Card Normalization Service

## Project Context

**Pokemon Exchanges** is a Pokémon card marketplace with a hidden admin sourcing engine.
The admin (Mitch) searches eBay for undervalued cards, scores them with AI, and buys them for resale.

**Tech stack:** Next.js 16 + TypeScript + Supabase (PostgreSQL) + OpenAI API + Tailwind CSS
**Working directory:** This file is in the project root. All source code is in `src/`.

---

## The Problem This Phase Solves

eBay listing titles are messy. Examples:
- `"🔥 ZARD HOLO PSA?? BASE 4/102 WOTC GEM MINT 🔥"`
- `"1999 charizard base set psa 10 vintage pokemon card"`
- `"Vintage Pokemon Pikachu yellow cheeks base set GRADED"`

When we try to look up market prices on TCGplayer using these raw titles, the search fails or returns wrong results.

**The fix:** Before hitting any pricing API, use OpenAI to parse the raw title into structured card data.

---

## What Already Exists

### Relevant files to read before starting:
- `src/lib/openai/scoring.ts` — existing OpenAI integration pattern to follow
- `src/lib/tcgplayer/client.ts` — calls `getMarketPrice(cardName, setName)` — needs normalized data
- `src/lib/sourcing/search.ts` — orchestrates eBay search + TCGplayer enrichment — needs normalization injected
- `src/lib/ebay/client.ts` — returns `EbayListing[]` with raw `title` field
- `src/lib/types/database.ts` — `ExternalListing` type has `card_name`, `set_name`, `card_number`, `condition`, `grading_company`, `grade` fields

### Environment variables already in `.env.local`:
- `OPENAI_API_KEY` — used for normalization

---

## What To Build

### 1. `src/lib/sourcing/normalization.ts` (new file)

A function that takes a raw eBay listing title and returns structured card data using OpenAI.

**Input:** Raw title string (e.g. `"ZARD HOLO PSA 10 BASE SET 4/102"`)

**Output:**
```ts
interface NormalizedCard {
  card_name: string | null        // e.g. "Charizard"
  set_name: string | null         // e.g. "Base Set"
  card_number: string | null      // e.g. "4/102"
  condition: string | null        // "Graded" or "Raw"
  grading_company: string | null  // "PSA", "BGS", "CGC", "SGC" or null
  grade: string | null            // "10", "9", "8" etc or null
  raw_condition: string | null    // "Near Mint", "Lightly Played" etc if raw
  confidence: number              // 0-100, how confident the AI is
}
```

**Requirements:**
- Use `gpt-4o-mini` with `response_format: { type: "json_object" }`
- Handle missing `OPENAI_API_KEY` gracefully — export an `OpenAIConfigError` class (already exists in `src/lib/openai/scoring.ts`, import from there)
- If OpenAI is not configured, return all nulls with confidence 0 rather than throwing — normalization is best-effort
- Cache results in memory (a simple `Map<string, NormalizedCard>`) to avoid re-normalizing the same title in one session

### 2. Update `src/lib/sourcing/search.ts`

After saving eBay results to the DB, call `normalizeTitle()` for each listing that has no `card_name` yet, then update the DB row with the normalized fields.

Currently `card_name`, `set_name` etc. are always `null` after an eBay search. This phase fixes that.

### 3. Update `src/lib/tcgplayer/client.ts`

`getMarketPrice()` currently accepts `cardName` and `setName`. No changes needed to the signature — normalization happens upstream. But add a note comment explaining the input should be normalized before calling.

### 4. `src/app/api/sourcing/normalize/route.ts` (new file)

A test endpoint for Mitch to manually normalize a title:

```
POST /api/sourcing/normalize
Body: { "title": "ZARD PSA 10 BASE SET" }
Response: { normalized: NormalizedCard }
```

Admin-only (same auth pattern as other `/api/sourcing/` routes).

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

## OpenAI Pattern (copy from `src/lib/openai/scoring.ts`)

- Use `fetch` directly to `https://api.openai.com/v1/chat/completions`
- Model: `gpt-4o-mini`
- `response_format: { type: "json_object" }`
- `temperature: 0.1` (low — we want deterministic parsing)
- Always wrap in try/catch

---

## Definition of Done

- [ ] `normalizeTitle(title: string): Promise<NormalizedCard>` exists in `src/lib/sourcing/normalization.ts`
- [ ] After an eBay search, every saved listing has `card_name` populated (where AI can determine it)
- [ ] TCGplayer enrichment uses the normalized `card_name` + `set_name` — not the raw eBay title
- [ ] `POST /api/sourcing/normalize` works and returns structured data
- [ ] Missing `OPENAI_API_KEY` returns nulls gracefully, does not crash
- [ ] `npm run build` passes with no type errors

---

## Testing

1. `npm install` then `npm run dev -- -p 3001`
2. Log in as admin, go to `/admin/sourcing`
3. Search for `"Charizard Base Set"`
4. Check the DB (`external_listings` table in Supabase) — `card_name` should now be `"Charizard"`, `set_name` `"Base Set"` etc.
5. Test the normalize endpoint directly: `POST /api/sourcing/normalize` with body `{"title": "1999 ZARD HOLO PSA 10 BASE 4/102"}`
