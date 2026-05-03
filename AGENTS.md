# 🧠 Project Identity: Pokemon Exchanges

This repository is **Pokemon Exchanges** — a Pokémon card marketplace for buying, selling, sourcing, and managing collectible Pokémon cards.

---

## 🚨 HARD PROJECT BOUNDARY (CRITICAL)

You are working ONLY in this project.

- Root directory: `C:\Users\xpone\apps\Pokemon_Exchanges`
- Worktree directory: `C:\Users\xpone\apps\Pokemon_Ex_Worktrees`
- GitHub repo: https://github.com/xponetial/Pokemon_Exchanges.git
- Production domain: https://pokemonexchanges.com

### ❌ NEVER DO THIS
- Do NOT access or modify files outside this repository
- Do NOT reference or use code from **Party Swami**
- Do NOT reference or use code from **Texas Rate**
- Do NOT use Party Swami or Texas Rate GitHub repos, domains, APIs, or environment variables
- Do NOT assume shared configs across projects

If uncertain → STOP and ask.

---

## 🧭 Project Context

Pokemon Exchanges is:

- A Pokémon card marketplace
- A public storefront for cards available for sale
- A user marketplace where sellers can list cards
- A platform where Mitch can buy undervalued cards and resell them
- A commission-based marketplace where the platform takes a fee on each sale

Primary goals:

👉 Help Mitch source undervalued Pokémon cards  
👉 Allow users to buy and sell Pokémon cards  
👉 Manage listings, inventory, grading, pricing, and offers  
👉 Create an admin-only AI sourcing tool for hidden market research  
👉 Build trust around condition, authenticity, seller ratings, and transaction safety  

---

## 🧠 Admin AI Sourcing Context

The admin section may include private tools for Mitch to:

- Search eBay and other marketplaces
- Identify undervalued Pokémon cards
- Compare asking price vs market value
- Track watchlists
- Save sourcing opportunities
- Estimate resale margin
- Flag cards worth buying
- Monitor trends by card, set, grade, rarity, and condition

This admin functionality is private and must never be exposed to public users.

---

## ⚙️ Tech Stack Assumptions

- Next.js (latest — may include breaking changes)
- Vercel deployments (if used)
- Supabase or equivalent database/auth (if used)
- Stripe or marketplace payment provider (if used)
- Pokémon card APIs or catalog data sources (if used)
- eBay/search integrations for sourcing (if used)
- AI agents for admin card discovery, valuation, and listing support

---

## ⚠️ Next.js Warning (MANDATORY)

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know.

This version may include breaking changes:

- APIs may differ  
- File structure may differ  
- Conventions may differ  

Before writing or modifying code:

👉 Read relevant docs in:

`node_modules/next/dist/docs/`

Always heed deprecation warnings.
<!-- END:nextjs-agent-rules -->

---

## 🌐 Deployment Rules

- Production domain: `https://pokemonexchanges.com`
- All deployments must be validated before going live
- Do NOT assume staging or production configuration from other projects
- Do NOT reuse Party Swami or Texas Rate deployment setups

---

## 🧩 Environment Isolation

This project has its own:

- `.env.local`
- Database credentials
- Auth configuration
- Payment keys
- Marketplace API keys
- AI API keys
- Hosting configuration
- Admin-only sourcing configuration

### NEVER:

- Reuse environment variables from Party Swami  
- Reuse environment variables from Texas Rate  
- Mix environments between projects  
- Share API credentials across projects  
- Assume one project's Supabase, Stripe, Vercel, or Resend config applies here  

---

## 💰 Marketplace Rules (Payments, Escrow, Fees)

Pokemon Exchanges operates as a **commission-based marketplace**.

---

## 🧾 Core Marketplace Model

- Buyers purchase Pokémon cards listed by sellers
- Sellers receive payouts after successful transactions
- Platform takes a **commission fee** on every sale

### 💡 Default Flow

- Buyer pays → Platform  
- Platform holds funds  
- Platform deducts commission  
- Platform pays seller  

---

## 💸 Commission Structure

- Platform takes % fee per transaction (configurable)
- Includes:
  - Platform revenue fee
  - Payment processing fees (Stripe)
  - Optional premium features (future)

### Example:

- Sale price: $100  
- Platform fee (10%): $10  
- Processing (~3%): $3  
- Seller receives: ~$87  

---

## 🔐 Escrow & Trust Model

To prevent fraud and build trust:

### Required Flow:

1. Buyer purchases card  
2. Funds are captured and held  
3. Seller ships item  
4. Buyer receives item  
5. Buyer confirms OR auto-confirm after X days  
6. Funds released to seller  

---

## ⚠️ Disputes & Protection

System must support:

- Buyer disputes (not received, wrong item, condition issues)
- Temporary fund holds
- Admin resolution tools

### Admin Capabilities:

- View transactions  
- Freeze payouts  
- Issue refunds  
- Override confirmations  
- Ban users  

---

## 🧠 AI + Marketplace Integration

AI agents may assist with:

- Price recommendations  
- Market valuation  
- Fraud detection  
- Suspicious listing flags  
- Seller scoring  

### ❌ NEVER:

- Allow AI to execute payments  
- Allow AI to bypass escrow  
- Allow AI to expose financial data  

---

## 🧩 Payment Provider Assumptions

Preferred:

- Stripe
  - Stripe Checkout
  - Stripe Connect (for seller payouts)

---

## 🔒 Security & Compliance

- Never store raw card data  
- Use hosted payment pages (Stripe Checkout)  
- Enforce HTTPS everywhere  
- Log all transactions  

---

## 🚫 Critical Payment Rules

### NEVER:

- Send money directly buyer → seller  
- Bypass commission logic  
- Release funds early  
- Mix environments (dev/prod)  
- Use keys from other projects  

---

## 🧠 Agent Behavior Rules

Before making changes:

1. Confirm working directory:
   `Pokemon_Exchanges`

2. Read:
   - `AGENTS.md`
   - `README.md`

3. Validate:
   - Git remote is correct  
   - Branch is correct  
   - No cross-project references exist  

If anything is unclear → ASK.

---

## 🛑 Safety Rule

If there is ANY chance you are:

- In the wrong repo  
- Using wrong GitHub  
- Mixing Party Swami or Texas Rate  
- Using wrong API keys  

👉 STOP immediately.

---

## ✅ Summary

You are operating inside:

👉 Pokemon Exchanges ONLY  
👉 This repo ONLY  
👉 This environment ONLY  
👉 https://pokemonexchanges.com ONLY  

No cross-project assumptions. Ever.
