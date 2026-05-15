# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Specs complete, build not yet started. Entering **Week 1 — Foundations**.

## Current Goal

- Finalize spec files and kick off **U1 — Foundations**: Next.js scaffold, Supabase project, Tailwind + shadcn, Vercel deploy of a "hello world" page.

## Completed

- `project-overview.md` — V1 scope, user flow, in/out of scope, success criteria.
- `architecture.md` — stack, folder boundaries, storage model, auth, 10 invariants.
- `code-standards.md` — General, TypeScript, Next.js, Styling, API Routes, Data, File Organization.
- `ai-workflow-rules.md` — incremental spec-driven workflow, scoping, sync rules, exit criteria per unit.
- `ui-context.md` — colors, typography, radius, spacing, layout patterns, icons.
- **01 — Design System.** shadcn/ui (base-nova style, @base-ui/react) initialized; 19 components in `components/ui/`; `lucide-react` installed; `lib/utils.ts` `cn()` helper; globals.css with full design token `:root` block mapped to shadcn semantics; layout.tsx with Inter + JetBrains Mono via `next/font`; `TooltipProvider` at root; typecheck + build green.

## In Progress

- None.

## Next Up

- **U1 — Foundations.** Acceptance: prod URL renders "hello world"; Vercel previews per PR; lint + typecheck + build all green; `.env.local` template committed.
- **U2 — Auth.** Google SSO via Supabase; `@pelago.co` domain enforced server-side at the OAuth callback; admin role assigned from seeded email allowlist; learner gets 403 on `/admin`.
- **U3 — Data layer.** Six tables (`users`, `modules`, `materials`, `material_clicks`, `groups`, `group_members`) with RLS policies and a seed script for 8 weeks × ~3 modules with materials.

## Open Questions

- **Hard-gate progression in V1?** The unlock rule is "all compulsory clicked → next module unlocks". Confirm there's no override for admins to advance a learner manually. (Default: no override in V1.)
- **Track assignment source.** Track (`tech` vs `non_tech`) is currently learner-self-selected at first login. Should it be seeded from an HR CSV instead, to prevent miscategorization? (Default: self-select for V1.)
- **Group submission cutoff.** End of Week 5 is approximate. Need a specific date and time, hardcoded in `/lib/domain/cutoffs.ts`.
- **PIC selection.** Within a group, how is the PIC chosen — first to submit, or explicit `is_pic` toggle? (Default: explicit toggle, exactly one PIC per group, enforced in DB.)
- **Already-completed material click behavior.** Re-clicking a completed material — does it update `clicked_at` or stay first-click-wins? (Default per architecture invariants: first click wins, never updated.)
- **Pelago brand colors.** Current palette is the warm-but-clean default. Confirm whether to override with Pelago brand colors when we receive the brand sheet.
- **CSV export columns.** Decide on the exact column set for the admin CSV export. (Default candidate: `email, name, track, module_title, material_title, is_compulsory, clicked_at`.)

## Architecture Decisions

- **Stack: Next.js + Supabase + Vercel.** Best AI-coding-assistant ecosystem for a solo build; auth + Postgres + storage in one platform; free tier covers Cohort 1.
- **Content lives outside the platform.** Materials are external links (Google Docs, Slides, YouTube, Forms). The DB stores metadata only. Keeps authoring in Google Workspace and the DB tiny.
- **Click = completion.** No "Mark complete" button. Clicking a material link records completion server-side and 302-redirects to the external URL. Single code path, idempotent via `UNIQUE (user_id, material_id)`.
- **Compulsory vs optional materials.** A module unlocks the next when all of its compulsory materials are clicked. Optionals never gate.
- **Three admins, allowlist-only.** Megan, Data Lead, Boss. Seeded by email; no admin promotion UI. HR is not an admin.
- **Two roles only.** `learner`, `admin`. No reviewer role in V1 (capstone review is off-platform).
- **Single hardcoded cohort.** No multi-cohort support. Dates live in `/lib/domain/cutoffs.ts`.
- **RLS + middleware = two layers of authz.** Application-level guards first, RLS policies second. Both must be in place for any non-public table.
- **`/lib/db/*` is the only DB access layer.** Pages and routes never call Supabase directly.
- **Migrations are append-only.** No editing merged migrations.
- **No file storage in V1.** Capstone artifacts live in Google Drive, referenced by URL.
- **No AI in the product, no background jobs.** All work is synchronous request/response. CSV export builds in-memory.
- **Light only, warm-but-clean palette.** Off-white background, soft teal accent. Friendly without being playful.

## Session Notes

- Workspace: `/code/training-platform/` under the P1-AI-Training project.
- All six context files now live in `/code/training-platform/context/`.
- Timeline: today is 2026-05-15. Cohort kickoff is June 2026 — under 4 weeks to ship V1.
- Builder: solo (Megan), AI-assisted (Claude Code / Cursor).
- Build order is locked: U1 → U2 → U3 → U4 → U5 → U6 → U7 → U8 → U9, one half-week per unit on average.
- Next action: open a new chat focused on **U1 — Foundations**, with the five spec files as context.
