# Code Standards

## General

- Keep modules small and single-purpose. One file owns one concept (one entity, one component, one route).
- Fix root causes, do not layer workarounds. If a fix needs three `if` branches and a comment, the abstraction is wrong.
- Do not mix unrelated concerns in one component or route. Pages render UI and call `/lib/db`; they do not query Supabase directly or perform business logic.
- Pure logic (`isModuleUnlocked`, `moduleCompletion`, etc.) lives in `/lib/domain` and never imports I/O.
- Delete dead code on sight. No commented-out blocks left "for later".
- Every new dependency is recorded with a one-line justification in `/docs/decisions.md` before install.

## TypeScript

- `strict: true` is non-negotiable. Includes `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`.
- No `any`. Use `unknown` and narrow. `// @ts-expect-error` and `// @ts-ignore` require a one-line justification comment immediately above.
- Validate unknown external input (request bodies, search params, URL params, env vars) with a Zod schema at the system boundary before it reaches business logic.
- Types live in `/lib/schemas`. Infer with `z.infer<typeof Schema>` rather than hand-writing duplicate `interface`s.
- Prefer `type` for unions and primitives, `interface` for object shapes that may be extended.
- No enums. Use string literal unions (`'learner' | 'admin'`) for runtime ergonomics with Zod.

## Next.js

- Default to React Server Components. Add `'use client'` only when the file uses state, effects, or browser-only APIs.
- Data fetching happens in Server Components or Server Actions — never via `useEffect` + `fetch`.
- One route handler does one thing. `/api/track-click` records a click and redirects; it does not also export CSV.
- Server actions and route handlers must call `requireLearner()` or `requireAdmin()` as their first statement.
- After any mutation, call `revalidatePath()` on every affected page. Stale UI is a bug.
- Use `<Link>` for in-app navigation. Use plain `<a target="_blank" rel="noopener noreferrer">` only for external material URLs.
- Loading and error states are co-located: `loading.tsx` and `error.tsx` per route segment.

## Styling

- Use Tailwind utility classes. No hand-rolled CSS files except `globals.css` for the design tokens.
- Design tokens (color, radius, spacing scale) are CSS custom properties declared in `globals.css` and consumed via Tailwind's `theme.extend`. No hardcoded hex values in components.
- Follow the radius, spacing, and type scale defined in `ui-context.md`. Do not invent new sizes.
- One accent color, used sparingly. Status colors (success / warning / danger) are reserved for status semantics — not decoration.
- Compose via `cn()` (clsx + tailwind-merge). Never concatenate class strings with `+`.
- No inline `style={{ ... }}` except for dynamic values that cannot be expressed in Tailwind (e.g. a computed `width: 47%` for a progress bar).

## API Routes

- Validate and parse request input with a Zod schema before any logic runs. Reject with `400` on failure.
- Enforce auth and ownership before any mutation. `requireLearner()` / `requireAdmin()` first, then ownership check (the row's `user_id` matches the session), then mutate.
- Return consistent response shapes: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`. Never leak raw Supabase errors to the client.
- Use HTTP status codes correctly: `200` ok, `302` redirect (click-tracking), `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `500` unexpected.
- No business logic in route files beyond the orchestration: validate → authorize → call `/lib/db` → respond. If it grows past 40 lines, extract it.
- Log `user_id` and route. Never log emails, names, IPs, or request bodies.

## Data and Storage

- Metadata belongs in the database. Long-form content belongs in external systems (Google Docs, Slides, YouTube). Nothing in between.
- The `materials` table stores only metadata: `title`, `url`, `type`, `is_compulsory`, `order`. No HTML, no markdown body, no embedded media.
- No file uploads in V1. Supabase Storage is provisioned but unused. Capstone artifacts live in Google Drive and are referenced by URL only.
- `material_clicks` is insert-only and idempotent. `UNIQUE (user_id, material_id)` enforces "first click wins". Never update or delete rows from the app.
- All DB access goes through `/lib/db/*` functions. Direct `supabase.from(...)` calls outside `/lib/db` and `/lib/supabase` are forbidden.
- Every DB mutation receives a Zod-validated input. No raw `Request.json()` payloads reaching the DB.
- Migrations are append-only. Never edit a numbered migration after it has merged to `main`. Schema changes ship as new numbered migrations.
- Row-Level Security policies are the second line of defense. Application authz checks are the first. Both must be in place for any non-public table.

## File Organization

- `app/(learner)/` — Learner-facing pages (`/dashboard`, `/modules/[id]`, `/group`). No admin imports.
- `app/(admin)/` — Admin-facing pages (`/admin`, `/admin/modules`, `/admin/users`, `/admin/groups`). Guarded by middleware.
- `app/api/` — Route handlers. Currently only `track-click/route.ts`. One file, one responsibility.
- `app/auth/callback/route.ts` — OAuth callback. Enforces `@pelago.co` domain and upserts the `users` row.
- `components/ui/` — shadcn primitives. Vendored — minimal edits, never business logic.
- `components/learner/` — Learner-only components (ProgressRing, TimelineStrip, MaterialRow, ContinueCard).
- `components/admin/` — Admin-only components (CompletionHeatmap, ModuleForm, MaterialForm, UserDrillIn).
- `components/shared/` — Components used by both learner and admin surfaces (SidebarNav, PageHeader, EmptyState).
- `lib/supabase/` — Supabase client factories (`server.ts`, `client.ts`). The only files that import `@supabase/supabase-js`.
- `lib/auth/` — Session helpers and role guards (`getSessionUser`, `requireLearner`, `requireAdmin`). Server-only.
- `lib/db/` — Typed query and mutation functions. One file per entity (`users.ts`, `modules.ts`, `materials.ts`, `clicks.ts`, `groups.ts`).
- `lib/schemas/` — Zod schemas. Single source of truth for input validation and inferred types.
- `lib/domain/` — Pure functions (`isModuleUnlocked`, `moduleCompletion`, `dashboardState`, `cutoffs`). No I/O, no imports from `/lib/db` or `/lib/supabase`.
- `db/migrations/` — Numbered SQL migrations. Append-only.
- `db/seed.ts` — Seeds modules, materials, and the three admin emails.
- `docs/decisions.md` — Append-only architecture decision log.
- `public/` — Static assets only (logo, favicon). No user-uploaded content.
