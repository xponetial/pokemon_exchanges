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
