# Architecture Decision Log

Append-only. New entries go at the bottom.

---

## ADR-001 — Stack: Next.js + Supabase + Vercel

**Date:** 2026-05-15
**Status:** Accepted

**Decision:** Next.js (App Router, TypeScript) for the frontend/API layer; Supabase for auth + Postgres + optional storage; Vercel for hosting and CI/CD previews.

**Rationale:** Best AI-coding-assistant ecosystem for a solo build. Auth + Postgres + storage in a single platform. Free tier covers Cohort 1. Vercel's per-PR preview URLs are a first-class feature, not an afterthought.

**Consequences:** Locked to Supabase's auth model (Google OAuth, JWT). No multi-tenant or multi-region needs in V1, so no downsides.

---

## ADR-002 — Design tokens: warm-but-clean palette, 0.5 rem radius

**Date:** 2026-05-15
**Status:** Accepted

**Decision:** Off-white background (`#FAFAF7`), soft teal accent (`#2EA39A`), 0.5 rem base radius. All color decisions expressed as CSS custom properties in `globals.css`; shadcn semantic tokens map to those properties. No hardcoded hex values in component files.

**Rationale:** Friendly without being playful. Single source of truth for palette prevents drift. Pending brand sheet from Pelago — tokens make a full swap a one-file change.

**Consequences:** If Pelago brand colors are received before launch, only `globals.css` needs updating. Light mode only in V1; dark mode can be added by extending the `:root` block.

---

## ADR-003 — Domain enforcement at OAuth callback, not Supabase config

**Date:** 2026-05-18
**Status:** Accepted

**Decision:** The `@pelago.co` domain check runs server-side in `app/auth/callback/route.ts`. If the email doesn't end with `@pelago.co`, the callback calls `supabase.auth.signOut()` and redirects to `/sign-in?error=domain`.

**Rationale:** Supabase's built-in email allowlist blocks sign-in at the provider level but offers less control over the error UX. Doing the check in our callback lets us show a clear, branded error message and gives us one authoritative code path to audit. The callback is server-side only — the check cannot be bypassed from the client.

**Consequences:** A Supabase session is briefly created for non-Pelago accounts before we sign them out. The window is milliseconds and no `users` row is ever written for them.

---

## ADR-004 — Partial unique index for one PIC per group

**Date:** 2026-05-18
**Status:** Accepted

**Decision:** `group_members.is_pic` is `boolean NOT NULL DEFAULT false`. A partial unique index `CREATE UNIQUE INDEX one_pic_per_group ON group_members(group_id) WHERE is_pic` enforces that at most one member per group has `is_pic = true`.

**Rationale:** A check constraint cannot span rows. An application-layer guard alone can be bypassed by concurrent requests. A partial unique index is the minimal, DB-enforced mechanism: it only indexes the `true` rows, so the constraint is precise and cheap.

**Consequences:** To transfer PIC status, the app must first set `is_pic = false` on the current PIC before setting `is_pic = true` on the new one (or use a transaction). `adminSetPic` in `lib/db/groupMembers.ts` does this in two sequential updates.

---

## ADR-006 — In-platform exercises re-introduced for V1.1

**Date:** 2026-05-20
**Status:** Accepted

**Decision:** Reverse the V1 cut of in-platform exercises and file upload. Ship exercises with per-question types mid-cohort or for Cohort 2 as V1.1. Google Forms cover exercises for the first weeks of Cohort 1.

**Rationale:** Forms-based exercises lose in-platform completion tracking. In-platform exercises let us surface submission status on the dashboard, include exercises in the unlock gate, and give admins a review queue in the same tool — no context-switching to Google Forms for grading.

**Consequences:** Supabase free storage tier is 1 GB. At 5 MB × 100 learners × ~10 exercises ≈ 5 GB worst case for file-upload questions. Budget for the $25/mo Pro plan from the month file-upload exercises are enabled. The `exercise-uploads` bucket is private with path-based RLS. LLM auto-grading is explicitly out of scope — reviews stay manual. See ADR-007 for the question-level type architecture decision.

---

## ADR-007 — Question-level type model for exercises

**Date:** 2026-05-21
**Status:** Accepted

**Decision:** Remove the `type` column from the `exercises` table. Move type to each question row as `question_type ENUM('free_text','single_choice','multi_choice','file_upload','dropdown')`. Add `is_optional BOOL`, `conditional_on_question_id UUID NULL`, and `conditional_on_value TEXT NULL` to `exercise_questions`. Add `exercise_question_options` table for choice questions.

**Rationale:** The original two-type model (`qa` / `md_upload`) treated an exercise as a monolithic typed artifact. In practice, a useful exercise mixes question types — a multiple-choice warm-up, followed by a free-text reflection, followed by a file upload for the artefact. Putting type at the question level makes any combination possible without schema changes, and conditional logic (show this question only if a prior answer matches) falls out naturally from the same per-question model.

**Consequences:** Migrations 0012 and 0013 are additive (ALTER + new table); no existing data is lost. The `file_path` column on `exercise_submissions` is now unused (per-question uploads store paths in `exercise_answers.answer_text`) but retained to avoid a destructive migration. Admin form and learner form are fully rewritten to be question-type-aware. Old `QAExerciseForm` and `MdUploadExerciseForm` components removed; replaced by the unified `ExerciseForm`.

---

## ADR-005 — Insert-only clicks via ON CONFLICT DO NOTHING

**Date:** 2026-05-18
**Status:** Accepted

**Decision:** `material_clicks` has a `UNIQUE (user_id, material_id)` constraint. The click-tracking endpoint uses `upsert` with `ignoreDuplicates: true`, which maps to `ON CONFLICT DO NOTHING`. Re-clicking a material is a no-op — the original `clicked_at` timestamp is never updated.

**Rationale:** Completion is a one-way event: you either clicked it or you didn't. Updating the timestamp on re-click would skew any future analytics and adds no learner-facing value. First-click-wins matches the invariant in `architecture.md` and keeps the data model simple.

**Consequences:** If a learner clicks a material multiple times, only the first click is recorded. Admin exports reflect the first-click timestamp, which is the correct definition of "when this was completed."

---
