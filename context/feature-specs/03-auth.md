# 03 — Auth

## Goal

Let any Pelago employee sign in with Google, reject every other domain, upsert a `users` row on first sign-in, and gate `/admin/*` to seeded admin emails.

## Acceptance criteria

- Visiting `/` while signed out shows a sign-in page with a single **Sign in with Google** button.
- Successful Google OAuth with a `@pelago.co` email lands on `/dashboard` (existing placeholder is fine for this unit).
- OAuth callback with any other domain signs the user out and redirects to `/sign-in?error=domain` with a clear message.
- First sign-in upserts a `users` row with `role = admin` if the email is in the seeded allowlist, else `role = learner`.
- Sign-out via the sidebar profile menu returns the user to `/sign-in`.
- A learner visiting `/admin` is redirected to `/dashboard` with a flash message; an admin can access `/admin`.
- `requireLearner()` and `requireAdmin()` server helpers live in `lib/auth/` and are called by every protected page.
- No admin / role check exists in client-side React.

## In scope

- Supabase project provisioned; Google OAuth provider configured in Supabase dashboard.
- `users` table created (just this one — full data layer is U4).
- Auth callback route at `app/auth/callback/route.ts` enforcing domain + upserting `users`.
- Sign-in page at `app/sign-in/page.tsx`.
- Middleware at the project root: redirects `/admin/*` for non-admins, forwards everything else.
- `lib/supabase/server.ts` and `lib/supabase/client.ts` factories.
- `lib/auth/session.ts` with `getSessionUser`, `requireLearner`, `requireAdmin`.
- Sidebar profile menu with sign-out (minimal — full sidebar is U5).
- Seed entries for the three admin emails (Megan, Data Lead, Boss) in `db/seed.ts`.

## Out of scope

- Full sidebar nav (U5).
- Dashboard content (U5).
- Other tables (U4).
- Onboarding / track selection (U5).
- Password auth, magic links, SAML.

## Implementation notes

- Domain check is server-side in `app/auth/callback/route.ts`. Do **not** rely on Supabase's email allowlist alone — check `session.user.email.endsWith('@pelago.co')` and call `supabase.auth.signOut()` on failure.
- Admin allowlist lives in `lib/auth/admin-emails.ts` exporting `ADMIN_EMAILS: readonly string[]`. The callback compares lowercased email against this list when upserting.
- Middleware uses `@supabase/ssr` cookie reading. It only guards `/admin/*` — it does not redirect signed-out users from learner routes (page-level `requireLearner()` does that).
- `getSessionUser()` returns `{ id, email, name, role, track } | null`. Never `email` alone.
- Single env var added: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).

## Files to create

- `lib/supabase/{server,client,middleware}.ts`.
- `lib/auth/{session,admin-emails}.ts`.
- `lib/schemas/user.ts` (Zod schema for the `users` row).
- `lib/db/users.ts` (`upsertUserOnSignIn`, `getUserById`).
- `app/auth/callback/route.ts`.
- `app/sign-in/page.tsx`, `app/sign-in/sign-in-button.tsx` (`'use client'`).
- `app/sign-out/route.ts` (POST → `supabase.auth.signOut()` → 302 to `/sign-in`).
- `middleware.ts`.
- `db/migrations/0001_users.sql` — `users` table + RLS policy: a user can SELECT/UPDATE only their own row by `id = auth.uid()`. UPDATE allowed only on `name`.
- `db/seed.ts` (initial version — just admin emails for now).
- `docs/decisions.md` — entry: "Domain enforcement at OAuth callback, not Supabase config".

## Dependencies

- 02 (Foundations) — Next.js app must be deployable.

## Open questions

- Should the sign-in page have any branding / messaging beyond the button + Pelago domain note? (Default: minimal — logo + "Sign in with your @pelago.co Google account".)
- Should `requireAdmin()` 403 with a page, or silently redirect? (Default: redirect to `/dashboard` with toast — keeps admin routes invisible to learners.)

## Definition of Done

- Manual test matrix passes:
  - `me@pelago.co` (admin) → can reach `/dashboard` and `/admin`.
  - `me@pelago.co` (learner) → can reach `/dashboard`, gets redirect from `/admin`.
  - `me@gmail.com` → rejected at callback with clear error.
- `users` row has correct `role` after each test.
- `npm run build` green; no `console.error` on the happy path.
