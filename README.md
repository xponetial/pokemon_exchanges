# Pokémon Exchanges

A hybrid Pokémon card platform: a public marketplace for buying and selling cards, plus a private AI-powered sourcing engine for identifying undervalued cards across external marketplaces (eBay, TCGplayer) for arbitrage.

See [docs/PRD.md](docs/PRD.md) for the full product requirements document.

## Roadmap (built in phases, one git worktree per phase)

1. **Phase 1 — MVP Marketplace** — listings, buying/selling, Stripe Connect payments
2. **Phase 2 — Admin Sourcing Tool** — external search, AI deal scoring, admin dashboard
3. **Phase 3 — AI Agent System** — continuous scanning, alerts
4. **Phase 4 — Semi-Autonomous Trading** — auto-listing, price optimization
5. **Phase 5 — Full AI Marketplace** — automated sourcing + selling

## Tech Stack
Next.js + Tailwind · Supabase (Postgres + Auth) · Stripe Connect · OpenAI · Vercel

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build + type check
npm test             # run unit tests (no API keys needed)
npm run test:watch   # re-run tests on file save
npm run lint         # lint
```

## Dev Seed Data

Populate the dev database with 20 fake Pokemon card listings (real card images from the Pokemon TCG API):

```bash
npm run seed
```

Then start the dev server and browse the marketplace:

```bash
npm run dev
# visit /browse or the home page to see listings
```

To wipe seed data and start fresh:

```bash
npm run seed:clean
npm run seed
```

**Requirements:** `SEED_ENV=development` must be in `.env.local` (already set). The seed script hard-blocks against any environment that doesn't have this — seed data will never reach production.

Seed sellers are identified by their `@pokeseed.dev` email domain. `seed:clean` only removes those accounts and their listings — real user data is never touched.
