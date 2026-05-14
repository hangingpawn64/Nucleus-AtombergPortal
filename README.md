# Portal Starter

Reusable hackathon-ready portal foundation built with Next.js App Router, JavaScript, Tailwind CSS, shadcn/ui-style components, Supabase, Zustand, React Hook Form, Zod, Recharts, Sonner, Lucide React, and Framer Motion.

This starter intentionally avoids domain-specific workflows. Use it as a clean base for management systems, analytics portals, AI dashboards, tracking tools, educational portals, healthcare portals, admin systems, and workflow platforms.

## Initial Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required for Supabase-backed auth and realtime:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The UI can render without Supabase values, but protected auth behavior needs these variables.

## Installed Stack

- Next.js App Router with `src/`
- Tailwind CSS v4
- ESLint
- shadcn/ui-style primitives in `src/components/ui`
- Supabase Auth, database helpers, middleware, and realtime utilities
- Zustand stores
- React Hook Form + Zod validation
- Recharts chart foundation
- Sonner toasts
- Lucide React icons
- Framer Motion micro-interactions

## Folder Structure

```text
src/
  app/
    (auth)/
    api/
    dashboard/
    layout.js
  components/
    charts/
    dashboard/
    forms/
    shared/
    ui/
  constants/
  hooks/
  lib/
    supabase/
    utils/
    validations/
  services/
  store/
  styles/
  types/
supabase/
  schema.sql
  realtime.sql
```

## Core Architecture

- `src/proxy.js` protects `/dashboard` routes and redirects authenticated users away from auth pages.
- `src/components/shared/auth-provider.js` persists auth state and exposes logout.
- `src/lib/supabase/*` contains browser/server/middleware clients and realtime helpers.
- `src/services/*` contains reusable CRUD, auth, notification, and activity helpers.
- `src/components/dashboard/*` contains the responsive shell, sidebar, navbar, stats, and activity feed.
- `src/components/shared/*` contains reusable table, search, filter, modal, confirmation, loading, empty, error, and pagination components.

## Supabase Database

Run `supabase/schema.sql` in the Supabase SQL editor to create:

- `users`
- `profiles`
- `notifications`
- `activity_logs`

Run `supabase/realtime.sql` after enabling realtime on the project. The app includes subscription utilities for notifications and activity updates.

## Auth

Routes:

- `/login`
- `/signup`
- `/dashboard`

Auth includes:

- Supabase email/password login and signup
- Session persistence through Supabase cookies
- Middleware route protection
- Logout from the profile dropdown
- Loading and error handling

## Dashboard

The dashboard foundation includes:

- Desktop sidebar
- Mobile sidebar dialog
- Top navbar
- User dropdown
- Notification placeholder
- Search placeholder
- Theme toggle placeholder
- Stats cards
- Placeholder Recharts analytics section
- Activity feed placeholder
- Responsive grid layout

## Admin Foundation

Routes:

- `/dashboard/admin`
- `/dashboard/admin/users`
- `/dashboard/admin/activity`

These pages use sample data by design. Replace sample constants with Supabase queries when the hackathon problem statement is known.

## Quality Checks

```bash
npm run lint
npm run build
npm run check
```

## Deployment

For Vercel:

1. Add the environment variables from `.env.example`.
2. Set the build command to `npm run build`.
3. Set the install command to `npm install`.
4. Configure Supabase auth redirect URLs for your production domain.
5. Run the SQL files in `supabase/`.

## Recommended Workflow

1. Keep domain logic out of `components/ui` and `components/shared`.
2. Add problem-specific modules under `src/app/dashboard/...`, `src/services`, and `src/lib/validations`.
3. Start with Supabase schema changes, then service helpers, then UI.
4. Use `DataTable`, `FormWrapper`, `Modal`, `ConfirmationDialog`, and state components before creating new abstractions.
5. Run `npm run check` before every handoff or deployment.
