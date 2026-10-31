# 🍱 SnackDesk

[![Live](https://img.shields.io/badge/Live_Demo-Visit_App-green)](https://snackdesk.shubhamspatil.me/)
[![Demo Video](https://img.shields.io/badge/YouTube-Watch_Demo-red)](https://www.youtube.com/watch?v=fp6EKVy0Zvc)

SnackDesk is an internal office snack ordering platform built for organizations.

Admins can create ordering windows, manage menus, approve orders, track spending, and view employee rankings. Employees can place, update, and cancel orders in real-time through a simple dashboard.

## Features

- Multi-tenant organizations
- Invite code based onboarding
- Super Admin, Admin & User roles
- Order windows with countdown timers (auto-close and auto-approve on expiry)
- Menu, category & shop management (with UPI payment QR per shop)
- Order approval workflow, item replacements, and late / on-behalf orders
- Group item splitting (cost shared between participants)
- Spin-the-wheel "split master" winner per window, with paid tracking
- Real-time updates using PostgreSQL LISTEN/NOTIFY + SSE
- Employee rankings
- Spending analytics, charts & activity heatmap
- Order history
- Responsive dashboard

## Tech Stack

- Next.js 16
- TypeScript
- PostgreSQL
- Prisma ORM
- Better Auth
- Tailwind CSS
- shadcn/ui
- Server Sent Events (SSE)

---

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

Create a `.env` file:

```env
# Prisma Database (Pooled Connection)
DATABASE_URL=

# PostgreSQL LISTEN / NOTIFY (Direct Connection)
PG_NOTIFY_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Initial Super Admin
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

### Generate Prisma Client

```bash
pnpm db:generate
```

### Run Migrations

```bash
pnpm db:migrate
```

### Seed Super Admin

```bash
pnpm db:seed
```

### Start Development Server

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

---

## Environment Variables

### DATABASE_URL

Used by Prisma for all application queries.

Example:

```env
DATABASE_URL=postgresql://...
```

### PG_NOTIFY_URL

Direct PostgreSQL connection used for LISTEN / NOTIFY.

This must be a **non-pooled** connection when using Neon.

Example:

```env
PG_NOTIFY_URL=postgresql://...
```

### BETTER_AUTH_SECRET

Secret used by Better Auth to sign sessions.

Example:

```env
BETTER_AUTH_SECRET=your-secret
```

### BETTER_AUTH_URL

Application URL.

Development:

```env
BETTER_AUTH_URL=http://localhost:3000
```

Production:

```env
BETTER_AUTH_URL=https://your-domain.com
```

### SUPER_ADMIN_EMAIL

Email used for the initial Super Admin account.

### SUPER_ADMIN_PASSWORD

Password used for the initial Super Admin account.

---

## Available Scripts

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Lint

```bash
pnpm lint
```

### Database

Start local PostgreSQL container:

```bash
pnpm db:up
```

Stop local PostgreSQL container:

```bash
pnpm db:down
```

Generate Prisma Client:

```bash
pnpm db:generate
```

Create and apply migrations:

```bash
pnpm db:migrate
```

Open Prisma Studio:

```bash
pnpm db:studio
```

Seed database:

```bash
pnpm db:seed
```

Reset database:

```bash
pnpm db:reset
```

---

## User Roles

### Super Admin

- Create organizations
- View all organizations
- Manage organization admins

### Admin

- Create order windows
- Manage menus and shops
- Approve or reject orders, apply replacements, add late orders
- Spin the wheel and mark windows as paid
- Manage members and generate password reset tokens
- View analytics and rankings

### User

- Place orders
- Update orders
- Cancel orders
- Split items with teammates
- View rankings and history

---

## Real-Time Architecture

SnackDesk uses PostgreSQL LISTEN/NOTIFY combined with Server-Sent Events (SSE).

```txt
Admin Action
      ↓
 PostgreSQL NOTIFY
      ↓
 LISTEN Subscriber
      ↓
 Server-Sent Events
      ↓
 Connected Clients
```

Each server instance keeps a single `LISTEN` connection shared by all open SSE streams. When a window's countdown runs out, the window is closed on the server and a `window_closed` event refreshes every viewer.

For Neon users:

- Use pooled connection for `DATABASE_URL`
- Use direct connection for `PG_NOTIFY_URL`

---

## Caching

[Cache Components](https://nextjs.org/docs/app/getting-started/caching) are enabled.

- Read queries in `modules/*/queries.ts` are cached with `"use cache: remote"` and tagged per organization (`orders`, `menu`, `members`), see `lib/cache-tags.ts`.
- Server actions expire the tags they change with `expireOrgData(...)`, so pages refetch only when their data changes (plus a 15-minute safety revalidation).
- Data for the active order window is never cached.
- The browser reuses visited pages for 60 seconds (`staleTimes`); live pages refetch when shown again.

When adding a server action that writes data, call `expireOrgData` for the affected kinds, or pages will keep showing old numbers.

---

## Deployment

1. Push repository to GitHub
2. Import project into Vercel
3. Configure environment variables
4. Set the Vercel function region close to your database (e.g. `sin1` for Neon `ap-southeast-1`)
5. Deploy
6. Seed Super Admin account

---

Built with ❤️ by Shubham Patil.
