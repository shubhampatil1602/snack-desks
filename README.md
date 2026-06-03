# 🍱 SnackDesk

SnackDesk is an internal office snack ordering platform built for organizations.

Admins can create ordering windows, manage menus, approve orders, track spending, and view employee rankings. Employees can place, update, and cancel orders in real-time through a simple dashboard.

## Features

- Multi-tenant organizations
- Invite code based onboarding
- Super Admin, Admin & User roles
- Order windows with countdown timers
- Menu & category management
- Order approval workflow
- Real-time updates using PostgreSQL LISTEN/NOTIFY + SSE
- Employee rankings
- Spending analytics
- Order history
- Responsive dashboard

## Tech Stack

- Next.js 15
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
- Manage menus
- Approve or reject orders
- View analytics and rankings

### User

- Place orders
- Update orders
- Cancel orders
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

For Neon users:

- Use pooled connection for `DATABASE_URL`
- Use direct connection for `PG_NOTIFY_URL`

---

## Deployment

1. Push repository to GitHub
2. Import project into Vercel
3. Configure environment variables
4. Deploy
5. Seed Super Admin account

---

Built with ❤️ by Shubham Patil.
