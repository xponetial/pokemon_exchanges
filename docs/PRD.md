# PRD: Pokémon Exchanges

**Version:** 1.0
**Owner:** Mitch / Platform Admin
**Prepared For:** Codex Implementation
**Date:** May 2026

---

## 1. Product Overview

Pokémon Exchanges is a hybrid platform that combines:

- A public marketplace for buying and selling Pokémon cards
- A private AI-powered sourcing engine for identifying undervalued cards across external marketplaces

The platform enables:

- Users to buy/sell cards
- Mitch to source undervalued cards using AI
- The system to evolve into an AI-driven trading engine

## 2. Goals & Objectives

### Primary Goals
- Build a scalable Pokémon card marketplace
- Enable Mitch to find and exploit pricing inefficiencies
- Generate revenue via:
  - Transaction fees
  - Arbitrage (buy low, sell high)

### Secondary Goals
- Build AI-driven valuation system
- Establish trust (reduce fake cards, scams)
- Create long-term collectible intelligence platform

## 3. User Roles

### 3.1 Public Users
- Browse cards
- Buy cards
- Sell cards
- Track their listings

### 3.2 Sellers
- Create listings
- Manage inventory
- Receive payouts

### 3.3 Admin (Mitch)
- Access hidden sourcing engine
- Run AI deal searches
- Manage inventory acquired externally
- Approve purchases
- View analytics

## 4. Core Features

### 4.1 Public Marketplace
- Browse cards
- Advanced search: Pokémon name, Set, Card number, Condition, Grade (PSA, BGS, CGC), Price range
- Card detail pages
- Seller profiles
- Add to cart / checkout
- Order tracking

### 4.2 Seller System
- Seller onboarding
- Create listing: card metadata, condition, price, images
- Manage listings
- Sales dashboard
- Stripe payouts

### 4.3 Payments & Commission
- Use Stripe Connect
- Platform takes % fee per transaction
- Handle: buyer payments, seller payouts, refunds

### 4.4 Admin Sourcing Engine (CORE DIFFERENTIATOR)

Hidden Admin Section.

**External Search**
- Query: eBay, TCGplayer
- Optional future: Cardmarket, PWCC

**AI Normalization** — convert messy titles into structured data: Pokémon, Set, Number, Condition, Grade

**Deal Detection**
- Compare listing price vs market value
- Output: % under market, Deal score (0–100)

**Risk Scoring**
- Seller rating, listing quality, image clarity, fake probability

**Admin Dashboard**
- List of "opportunities"
- Filters: % below market, card type, price range
- Actions: save to watchlist, mark as purchased, ignore

### 4.5 Inventory Management
- Convert sourced cards into internal inventory
- Track: purchase price, current value, profit margin
- Auto-create listings

### 4.6 AI Deal Agent (Phase 2+)
- Continuously scan marketplaces
- Identify undervalued cards
- Alert Mitch
- Example: "Charizard Base Set PSA 8 listed at $180 — market value $240 → 25% underpriced"

### 4.7 Future: Multi-Agent System (Phase 3+)
Agents: Sourcing, Pricing, Risk, Inventory, Market Trend.

## 5. AI System Design

**Inputs:** External listings, historical pricing, card metadata
**Outputs:** Normalized card data, market value estimate, deal score, risk score
**Use Cases:** Search interpretation, listing normalization, price prediction, basic fraud detection

## 6. Data Model (High-Level)

- **users** — id, email, role
- **sellers** — user_id, stripe_account_id
- **cards** — id, name, set, number, rarity
- **listings** — id, seller_id, card_id, condition, grade, price, status
- **orders** — id, buyer_id, total_price, status
- **inventory** — id, source (external/internal), purchase_price, current_value
- **external_listings** — id, source (eBay, etc), raw_title, parsed_card_id, price, seller_rating
- **deal_scores** — listing_id, score, undervalue_percent, risk_score
- **watchlist** — admin_id, listing_id

## 7. Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Next.js API routes or NestJS
- **Database:** PostgreSQL (via Supabase)
- **Payments:** Stripe Connect
- **AI:** OpenAI API
- **External Data:** eBay Browse API, TCGplayer API (if accessible)
- **Infra:** Vercel (hosting), Redis (caching), Cloudflare (security)

## 8. Security & Trust
- Seller ratings
- Fraud reporting
- Image requirements for listings
- Admin moderation tools
- Rate limiting via Cloudflare
- Input validation (SQL injection prevention)

## 9. Monetization
- Transaction fees (primary)
- Arbitrage profits (Mitch inventory)
- Future: premium analytics, AI tools for users

## 10. Phased Roadmap
- **Phase 1 — MVP Marketplace:** listings, buying/selling, Stripe payments
- **Phase 2 — Admin Sourcing Tool:** external search, AI deal scoring, dashboard
- **Phase 3 — AI Agent System:** continuous scanning, alerts
- **Phase 4 — Semi-Autonomous Trading:** auto-listing, price optimization
- **Phase 5 — Full AI Marketplace:** automated sourcing + selling

## 11. Key Differentiator

Pokémon Exchanges is not just a marketplace — it is a **card trading intelligence platform**:
- Finds deals automatically
- Uses AI to evaluate investments
- Enables arbitrage at scale

## 12. Success Metrics
- GMV (Gross Merchandise Value)
- Number of active sellers
- Deal conversion rate (admin buys)
- Average profit per sourced card
- Marketplace take rate (% fees)

---

## Visual Direction
- **Color palette:** Facebook Marketplace style — primary blue `#1877F2`, white, light gray neutrals
- **Layout / IA:** modeled after amazon.com — global top nav with search, category strip, left-rail filters, dense product grid, product detail with gallery + buy box
