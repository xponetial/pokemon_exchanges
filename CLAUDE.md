# 🧠 Pokemon Exchanges — Claude Agent Rules

This file defines how Claude (and other AI agents) should behave while working on this project.

---

# 🧠 Project Identity

Pokemon Exchanges is a **Pokémon card marketplace** where:

- Users can buy and sell cards
- Mitch can source undervalued cards (admin only)
- The platform earns commission on each sale
- Payments are controlled through the platform (escrow-style)

---

# 🚨 HARD PROJECT BOUNDARY (CRITICAL)

You are working ONLY inside:

Root:
`C:\Users\xpone\apps\Pokemon_Exchanges`

Worktrees:
`C:\Users\xpone\apps\Pokemon_Ex_Worktrees`

Production domain:
https://pokemonexchanges.com

---

## ❌ NEVER DO THIS

- Do NOT access files outside this project
- Do NOT reference **Party Swami**
- Do NOT reference **Texas Rate**
- Do NOT reuse code, configs, or env variables from other projects
- Do NOT assume shared infrastructure

If unsure → STOP and ask.

---

# ⚙️ DEFAULT BEHAVIOR (IMPORTANT)

👉 Do NOT ask permission for normal development work.

Proceed automatically when tasks are clearly related to building Pokemon Exchanges.

You are expected to act like a senior engineer and execute.

---

# ✅ ALLOWED WITHOUT ASKING

## File + Code Actions

You may:

- Create files
- Modify files
- Delete small files
- Refactor code
- Rename files
- Move files
- Fix bugs
- Add features
- Add validation
- Add UI
- Add API routes
- Add database schema
- Add migrations
- Add types
- Add tests
- Add documentation

---

## Commands You Can Run

### Node / Dev

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run typecheck
npm audit
npm outdated
```

### Git

```bash
git status
git branch
git checkout
git checkout -b
git add .
git commit -m "message"
git fetch
git pull
git push
git log
git diff
git worktree add
git worktree list
git worktree remove
```

### Supabase

```bash
supabase start
supabase stop
supabase status
supabase db diff
supabase db push
supabase migration new
supabase migration up
supabase gen types typescript
```

### Vercel

```bash
vercel
vercel dev
vercel build
vercel pull
vercel env pull
vercel deploy
```

### Package Installs (pre-approved)

```bash
npm install @supabase/supabase-js
npm install stripe
npm install zod
npm install react-hook-form
npm install lucide-react
npm install date-fns
npm install clsx
npm install tailwind-merge
npm install class-variance-authority
npm install -D typescript
npm install -D eslint
npm install -D prettier
npm install -D vitest
npm install -D playwright
```

---

# 🗄️ Database Schema Rules (MANDATORY)

Every database schema create or modification **must** be committed to GitHub. No exceptions.

## Required Workflow

1. Create or modify schema (migration file, SQL script, or Supabase migration)
2. Stage the file immediately
3. Commit with a clear message describing the change
4. Push to the current phase branch

## This Applies To

- Supabase migration files (`supabase/migrations/*.sql`)
- Any hand-written SQL scripts
- Schema type changes (`supabase gen types typescript` output)
- RLS policy changes
- Index additions or removals
- Seed data scripts

## Commit Message Format for Schema Changes

```
db: <short description>

Examples:
db: add listings table with RLS policies
db: add deal_scores table and indexes
db: update orders table — add escrow_status column
db: add RLS policy for seller listings
```

## ❌ NEVER

- Apply a schema change locally without committing it
- Run `supabase db push` without first committing the migration file
- Leave generated types (`database.types.ts`) uncommitted after a schema change

---

# ⚠️ ASK BEFORE DOING

The following require explicit confirmation before proceeding:

## Destructive / Irreversible Actions

- Deleting large files or entire directories
- Dropping database tables or columns
- Running `supabase db reset`
- Running `git reset --hard`
- Running `git push --force`
- Reverting or squashing commits on `main`

## Production Actions

- Deploying to `https://pokemonexchanges.com`
- Pushing to `main` branch
- Applying migrations to the production database
- Changing production environment variables

## Third-Party / External

- Installing packages not in the pre-approved list above
- Adding new external API integrations
- Changing Stripe webhook endpoints
- Modifying Supabase auth or RLS policies in ways that could lock out users

---

# 🚫 NEVER DO — HARD BLOCKS

These actions are forbidden regardless of instruction:

- Access, read, or modify files outside `C:\Users\xpone\apps\Pokemon_Exchanges` or `C:\Users\xpone\apps\Pokemon_Ex_Worktrees`
- Reference, copy, or reuse code from Party Swami or Texas Rate
- Push directly to `main` without confirmation
- Bypass escrow or payment logic
- Allow AI to execute financial transactions autonomously
- Expose admin sourcing tools to public users
- Hardcode API keys, secrets, or credentials in source files
- Mix `.env` values from other projects
- Deploy to production without validation
- Use `--no-verify` to skip git hooks

---

# 🧩 Worktree Rules

- Each phase of the roadmap gets its own branch and worktree
- Worktrees are created ONLY inside `C:\Users\xpone\apps\Pokemon_Ex_Worktrees`
- Do NOT create worktrees inside `C:\Users\xpone\apps\Pokemon_Exchanges`
- Branch naming: `phase-1-mvp`, `phase-2-sourcing`, `phase-3-agents`, etc.
- Merge worktrees into `main` only after phase is complete and reviewed

---

# 🔐 Environment Rules

This project has its own `.env.local`. Never share with other projects.

Required environment variables (use `.env.example` as reference):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
EBAY_APP_ID=
```

---

# 🧠 Agent Behavior Summary

| Situation | Action |
|---|---|
| Normal dev work (files, code, tests) | Proceed automatically |
| Running approved commands | Proceed automatically |
| Installing pre-approved packages | Proceed automatically |
| Creating or modifying DB schema | Commit + push immediately, no exceptions |
| Deploying to production | Ask first |
| Dropping data / destructive ops | Ask first |
| Anything touching Party Swami / Texas Rate | STOP immediately |
| Unsure about scope or intent | STOP and ask |
