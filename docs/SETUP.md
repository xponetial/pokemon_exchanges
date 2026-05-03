# Pokemon Exchanges — External Services Setup Guide

This document is the single source of truth for configuring every external service the platform uses.
All credentials go in `.env.local` (never committed to git). Use `.env.example` as the template.

---

## How to Apply a Change

1. Open `.env.local` in the project root
2. Find the variable name listed under the service below
3. Replace the value
4. Restart the dev server (`npm run dev`) — changes take effect immediately
5. For production: update the matching variable in Vercel (see [Vercel](#vercel) section)

---

## Services

### Supabase (Database + Auth)

**What it does:** Hosts the PostgreSQL database and handles user authentication.

**Dashboard:** https://supabase.com/dashboard/project/xhmhuyizhmwwbwikhycd

**Where to find keys:**
- Go to the dashboard → Settings → API
- Copy **Project URL**, **anon/public key**, and **service_role key**

**Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xhmhuyizhmwwbwikhycd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from dashboard — keep secret, server-side only>
```

**Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — never expose it to the browser
- If you reset the project keys, update both `.env.local` and Vercel environment variables

---

### Stripe (Payments + Seller Payouts)

**What it does:** Processes buyer payments and pays out sellers via Stripe Connect.

**Dashboard:** https://dashboard.stripe.com

**Where to find keys:**
- Developers → API keys → Publishable key + Secret key
- For the webhook secret: Developers → Webhooks → select the endpoint → Signing secret

**Variables:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   (or pk_test_... for dev)
STRIPE_SECRET_KEY=sk_live_...                     (or sk_test_... for dev)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Notes:**
- Use test keys (`pk_test_`, `sk_test_`) locally; switch to live keys only in production
- The webhook secret is unique per endpoint — if you add a new endpoint (e.g. local tunnel), register it in the Stripe dashboard and get a new `whsec_`
- Platform fee percentage is controlled separately: `NEXT_PUBLIC_PLATFORM_FEE_PERCENT=10`

---

### OpenAI (AI Deal Scoring)

**What it does:** Powers the AI deal scoring engine that evaluates arbitrage opportunities.

**Dashboard:** https://platform.openai.com

**Where to find keys:**
- API keys → Create new secret key

**Variables:**
```
OPENAI_API_KEY=sk-...
```

**Notes:**
- Set a monthly spend limit in the OpenAI dashboard to cap costs
- Key is server-side only — never expose in the browser

---

### eBay Browse API (External Card Search)

**What it does:** Searches eBay listings to find undervalued Pokémon cards for sourcing.

**Dashboard:** https://developer.ebay.com/my/keys

**Where to find keys:**
- Sign in → Application Keys → Production → App ID (Client ID)
- For OAuth user tokens, also grab the Client Secret

**Variables:**
```
EBAY_APP_ID=<your App ID / Client ID>
EBAY_CLIENT_SECRET=<your Client Secret>
EBAY_OAUTH_TOKEN=<generated OAuth token — rotates, see notes>
```

**Notes:**
- The App ID is used for public Browse API calls (no user auth required)
- OAuth tokens expire — the app should auto-refresh using the Client Secret
- Use the Sandbox keys (`EBAY_APP_ID_SANDBOX`) for local testing

---

### TCGplayer API (Card Pricing Data)

**What it does:** Pulls real-time market prices for Pokémon cards to validate deal scores.

**Dashboard:** https://developer.tcgplayer.com

**Where to find keys:**
- Apply for API access at the developer portal
- Once approved: dashboard → Apps → your app → Client ID + Client Secret

**Variables:**
```
TCGPLAYER_CLIENT_ID=<your Client ID>
TCGPLAYER_CLIENT_SECRET=<your Client Secret>
```

**Notes:**
- TCGplayer uses OAuth 2.0 — access tokens expire after 24 hours; the app handles refresh automatically
- Price data is read-only; no user account scope needed

---

### Resend (Transactional Email)

**What it does:** Sends order confirmations, seller payout notifications, and admin alerts.

**Dashboard:** https://resend.com

**Where to find keys:**
- API Keys → Create API Key

**Variables:**
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@pokemonexchanges.com
```

**Notes:**
- Verify your sending domain (`pokemonexchanges.com`) in the Resend dashboard under Domains
- Without domain verification, emails send from Resend's shared domain and may land in spam

---

### Vercel (Hosting + Deployments)

**What it does:** Hosts the Next.js app and manages preview + production deployments.

**Dashboard:** https://vercel.com/dashboard

**How to update a production environment variable:**
1. Go to the project in Vercel → Settings → Environment Variables
2. Find the variable → Edit → paste the new value
3. Choose scope: **Production**, **Preview**, or **Development**
4. Trigger a new deployment for the change to take effect (Settings → Deployments → Redeploy)

**Notes:**
- Variables set in Vercel override `.env.local` in deployed builds
- Pull latest env vars locally with: `vercel env pull .env.local`
- Never commit `.env.local` — it's in `.gitignore`

---

## Full `.env.local` Template

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xhmhuyizhmwwbwikhycd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Platform config
NEXT_PUBLIC_PLATFORM_FEE_PERCENT=10
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=

# eBay
EBAY_APP_ID=
EBAY_CLIENT_SECRET=
EBAY_OAUTH_TOKEN=

# TCGplayer
TCGPLAYER_CLIENT_ID=
TCGPLAYER_CLIENT_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@pokemonexchanges.com
```

---

## Database Migrations

Migrations are SQL files in `supabase/migrations/`. Every schema change (new tables, columns, indexes, RLS policies) lives here and must be committed to git.

### First-time setup — link your Supabase project

You only need to do this once per machine (or after cloning fresh):

```bash
npx supabase link --project-ref xhmhuyizhmwwbwikhycd
```

It will ask for your database password (find it in Supabase dashboard → Settings → Database → Database password).

### Apply pending migrations to the database

```bash
npx supabase db push
```

If you see an error about migrations being out of order, add `--include-all`:

```bash
npx supabase db push --include-all
```

### Create a new migration

```bash
npx supabase migration new <description>
```

This creates a new timestamped file in `supabase/migrations/`. Write your SQL in it, then run `supabase db push` to apply it.

### Check what migrations have been applied

```bash
npx supabase migration list
```

Shows which migrations are applied on the remote database vs. what exists locally.

### After any schema change

1. Create or edit the migration file in `supabase/migrations/`
2. Run `npx supabase db push` to apply it
3. Run `npx supabase gen types typescript --project-id xhmhuyizhmwwbwikhycd > src/lib/types/database.ts` to regenerate TypeScript types
4. Commit both the migration file and the updated `database.ts`

### Notes

- Never edit a migration file that has already been applied — create a new one instead
- The Supabase dashboard → Table Editor shows all tables live
- If you ever need to reset the local dev DB: `npx supabase db reset` (dev only — never on production)

---

## Security Rules

- Never commit `.env.local` to git
- Never paste secret keys in Slack, Discord, or email
- Rotate any key that has been accidentally exposed immediately
- `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are the most sensitive — treat like passwords
