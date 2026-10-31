## Agent skills

### Issue tracker

Not yet decided. Ask the user before creating or reading issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

Don't use git unless told!

## Project: SnackDesk

Internal office snack-ordering app (multi-tenant). Live: snackdesk.shubhamspatil.me. Package name `snack-desk`, pnpm.

**Stack:** Next.js 16 (App Router, server actions) · React 19 · TypeScript · Prisma 7 + `@prisma/adapter-pg` on Postgres (Neon in `.env`, local via `docker-compose`) · Better Auth · Tailwind 4 + shadcn/ui · Zustand · react-hook-form + zod · Recharts · Vercel AI SDK (Gemini).

**Roles:** Super Admin (platform) · Admin (org) · User (employee). Users join orgs via invite code.

**Core flow:** Admin opens an **Order Window** (label like tea/lunch, countdown, linked Shops) → users place/edit/cancel **Orders** of **Menu Items** → admin approves/rejects → window closes; a spin wheel picks the window's winner (`winnerUserId`, "split master"). Order status: `pending | approved | rejected | cancelled`. Window status: `active | closed`.

**Data notes (prisma/schema.prisma):**
- `OrderItem.replacementApplied = true` means the item was swapped out; replacement items are separate OrderItems (`originalOrderItemId`). Spend queries filter `replacementApplied: false`.
- `OrderItemSplit` = item shared with other users; each participant (owner + split users) pays `price × qty / participants`. History does this in JS (`modules/orders/user-history-queries.ts`); per-user spend SQL (user dashboard, rankings) uses `spendLinesCte` in `lib/spend-lines.ts`. Org-level revenue ignores splits (shares sum to the full price).
- Prices are read from the current `MenuItem.price` (no price snapshot on OrderItem).

**Layout:** `app/` routes (`(auth)`, `(user)`, `admin`, `super-admin`, `api`) · `modules/<feature>/queries.ts` read queries · `actions/` server actions · `lib/sse` real-time (Postgres LISTEN/NOTIFY → SSE) · `lib/date-utils.ts` IST helpers.

**Timezone (gotcha):** All business dates are IST (`Asia/Kolkata`). DB timestamps are `TIMESTAMP(3)` without tz, stored as UTC. In raw SQL, convert with `(col AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'` — a single `AT TIME ZONE 'Asia/Kolkata'` shifts the wrong way. Period strings: `"all"`, `"YYYY"`, `"YYYY-MM"` (`parsePeriod`).

**Commands:** `pnpm dev` · `pnpm lint` · `pnpm db:up|db:migrate|db:seed|db:studio`. No test suite.
