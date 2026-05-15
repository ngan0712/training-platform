# Architecture — AI Training Platform

## Stack

| Layer | Technology | Role |
|---|---|---|
| Language | TypeScript (strict) | Single language across UI + server. Catches integration bugs at compile time. |
| Framework | Next.js 14+ (App Router) | React UI + server actions + route handlers in one deployable. Best AI-coding-assistant ecosystem. |
| Hosting | Vercel | Git-push deploys, preview URLs per PR, free tier covers a single cohort. |
| Database | Supabase Postgres | Relational store for users, modules, materials, click records, groups. |
| Auth | Supabase Auth (Google OAuth) | Google SSO + server-enforced `@pelago.co` domain check. |
| Authz | Supabase Row-Level Security (RLS) + Next.js middleware | RLS at the row level; middleware blocks `/admin/*` for non-admins. |
| File storage | None in V1 | All curriculum content is external links (Google Docs / Slides / YouTube / Forms / readings). |
| Cache | None in V1 | Traffic is a single cohort (~100 users). Next.js default route caching is sufficient. |
| UI components | shadcn/ui (copy-paste) | Owned, customizable React components. |
| Styling | Tailwind CSS | Utility classes. Single accent + neutral palette per design spec. |
| Icons | Lucide | Ships with shadcn. |
| Forms / validation | React Hook Form + Zod | Zod schemas shared between forms and server-side validation. |
| Linting / formatting | ESLint + Prettier | Enforced via pre-commit hook. |
| CI | Vercel + GitHub Actions | Typecheck, lint, build on every PR. |
| Error tracking | None in V1 | Vercel logs only. Add Sentry post-launch if needed. |

## System boundaries

Folder layout under `/app/training-platform/`:

| Path | Owns |
|---|---|
| `/app/(learner)/**` | Learner-facing pages: `/dashboard`, `/modules/[id]`, `/group`. No admin logic permitted here. |
| `/app/(admin)/**` | Admin-facing pages: `/admin`, `/admin/modules`, `/admin/modules/[id]/materials`, `/admin/users`, `/admin/groups`. Guarded by middleware. |
| `/app/api/track-click/route.ts` | The single click-tracking endpoint. Records the completion event, then 302-redirects to the external material URL. |
| `/app/auth/callback/route.ts` | OAuth callback. Enforces `@pelago.co` domain check. Creates `users` row on first sign-in. |
| `/components/ui/**` | shadcn primitives. Treated as vendored — minimal edits, never business logic. |
| `/components/learner/**` | Learner-only components (ProgressRing, TimelineStrip, MaterialRow, ContinueCard). |
| `/components/admin/**` | Admin-only components (CompletionHeatmap, UserDrillIn, ModuleForm, MaterialForm). |
| `/components/shared/**` | SidebarNav, PageHeader, EmptyState — used by both. |
| `/lib/supabase/server.ts`, `/lib/supabase/client.ts` | Supabase client factories. The only files that import the SDK directly. |
| `/lib/auth/**` | `getSessionUser()`, `requireLearner()`, `requireAdmin()`. Server-only. |
| `/lib/db/**` | Typed query + mutation functions. One file per entity: `users.ts`, `modules.ts`, `materials.ts`, `clicks.ts`, `groups.ts`. Pages and routes call these — never the SDK directly. |
| `/lib/schemas/**` | Zod schemas for forms and DB row shapes. Single source of truth for types. |
| `/lib/domain/**` | Pure functions: `isModuleUnlocked()`, `moduleCompletion()`, `dashboardState()`. No I/O. |
| `/db/migrations/**` | SQL migrations. Numbered, append-only. |
| `/db/seed.ts` | Seeds modules, materials, and the three admin emails (Megan, Data Lead, Boss). |
| `/docs/decisions.md` | Append-only architecture decision log. |

## Storage model

### Database (Supabase Postgres)

| Table | Purpose | Key columns |
|---|---|---|
| `users` | One row per Pelago employee who has signed in. | `id` (uuid, = auth.users.id), `email`, `name`, `role` (`learner` \| `admin`), `track` (`tech` \| `non_tech`), `created_at` |
| `modules` | Curriculum modules, one per week-block. | `id`, `week_number`, `order`, `title`, `description`, `required_for_track` (`both` \| `non_tech_only`) |
| `materials` | External link items inside a module. | `id`, `module_id`, `order`, `title`, `url`, `type` (`doc` \| `slides` \| `reading` \| `video` \| `form`), `is_compulsory` (bool) |
| `material_clicks` | One row per (user, material) the first time they click. | `id`, `user_id`, `material_id`, `clicked_at`, **UNIQUE (user_id, material_id)** |
| `groups` | Capstone groups, formed pre-Week 6. | `id`, `name`, `project_idea`, `created_at` |
| `group_members` | Group ↔ user join. | `group_id`, `user_id`, `is_pic` (bool) |

### File storage

- Not used in V1. Supabase Storage is provisioned but no buckets are created.
- Capstone artifacts live in Google Drive (link supplied later, off-platform).

### Cache

- No explicit cache layer. Next.js handles route-level caching by default.
- Server actions that mutate (`track-click`, group submission, admin CRUD) must call `revalidatePath()` on affected pages.

## Auth & access model

### Authentication

- Single sign-in method: **Google OAuth via Supabase Auth**.
- `/app/auth/callback/route.ts` runs server-side after Google redirects back:
  1. Exchanges the code for a session.
  2. Checks the email domain. If `!= @pelago.co` → sign out + redirect to `/sign-in?error=domain`.
  3. Upserts a `users` row. If the email matches a seeded admin email → sets `role = admin`. Otherwise `role = learner`.
  4. New learners are redirected to `/onboarding` (track selection). Returning users go to `/dashboard`.

### Authorization

- **Role gating (admin vs learner):** Next.js middleware on `/admin/*` reads the session, calls `requireAdmin()`, redirects learners to `/dashboard` with a flash message.
- **Row gating (learner sees only their own data):** Supabase RLS policies.

| Table | Learner can SELECT | Learner can INSERT/UPDATE | Admin can SELECT | Admin can INSERT/UPDATE |
|---|---|---|---|---|
| `users` | own row only | own row (name only) | all rows | none via app (seed script + DB only) |
| `modules` | all rows | none | all rows | yes (admin pages) |
| `materials` | all rows | none | all rows | yes (admin pages) |
| `material_clicks` | own rows only | insert own (idempotent on UNIQUE) | all rows | none |
| `groups` | all rows (read) | own group (until cutoff) | all rows | yes |
| `group_members` | all rows (read) | own membership (until cutoff) | all rows | yes |

### Ownership

- A `material_click` is owned by its `user_id`. It is insert-only — never updated, never deleted from the app.
- A `group` is owned collectively by its `group_members`. Any member may edit `name` / `project_idea` until the admin-set cutoff date (hardcoded in `/lib/domain/cutoffs.ts`).
- Admin role is owned by the seed script. The app never grants or revokes admin role at runtime.

## AI & background tasks

- **No AI in the product surface for V1.** The platform does not call any LLM. (The training program teaches AI; the platform itself does not use it.)
- **No background workers, queues, or cron jobs in V1.**
- All work is synchronous request/response. CSV export builds in-memory and streams to the browser.
- Reserved hook for later: if Cohort 2 needs reminder emails, add a Vercel Cron job that reads `material_clicks` and posts to Slack via webhook. Not built in V1.

## Invariants — never violate

1. **No SDK calls from page components.** Pages, components, and route handlers must call functions in `/lib/db/*`. Direct `supabase.from(...)`, raw SQL, or REST calls outside `/lib/db` are forbidden. Reason: keeps queries typed, testable, and grep-able.
2. **Authorization is always server-enforced.** No admin / role check lives in client-side React. Every protected page calls `requireAdmin()` or `requireLearner()` server-side, and every protected table has matching RLS policies. Disabling JS must not leak admin data.
3. **Curriculum content never lives in the database.** The `materials` table stores only metadata (title, URL, type, compulsory flag). The body of a lesson is always behind an external URL. No markdown, no HTML, no embedded video files. Reason: keeps authoring in Google Docs / Slides where it belongs and keeps the DB tiny.
4. **Completion is recorded only by the click-tracking endpoint.** `material_clicks` may only be inserted by `/app/api/track-click/route.ts`. No "Mark complete" button, no admin override to mark a user complete, no manual SQL inserts from the app. Reason: completion has exactly one meaning and one code path.
5. **Admin role is allowlist-only and seed-time only.** `users.role = 'admin'` is set only when the email matches the seeded admin list (Megan, Data Lead, Boss). No admin promotion UI. To add an admin, edit the seed and redeploy.
6. **Every DB mutation passes a Zod schema.** Server actions and route handlers validate input via `/lib/schemas/*` before calling `/lib/db/*`. No unvalidated `Request.json()` reaching the DB.
7. **No PII in logs.** Log `user_id` (uuid) only — never email, name, or IP. Reason: this is an internal compulsory program; we err on the side of less data captured.
8. **No third-party analytics, trackers, or marketing SDKs.** Vercel logs are the only telemetry. Reason: trust posture for a compulsory internal program.
9. **No `any` in TypeScript.** Use `unknown` and narrow. `// @ts-ignore` requires a one-line justification comment.
10. **Migrations are append-only.** Never edit a numbered migration after it has been merged to `main`. Schema changes ship as new numbered migrations.
