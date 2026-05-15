# 06 — Module Page & Click Tracking

## Goal

Build the per-module view, the click-tracking endpoint that records completion, and the unlock rule that gates progression on compulsory clicks.

## Acceptance criteria

- `/modules/[id]` renders: title, week number, description, and a vertical list of materials.
- Each `MaterialRow` shows: type icon, title, Compulsory/Optional badge, completion checkmark (if clicked), and is fully clickable.
- Clicking a material row issues a request to `/api/track-click?materialId=<id>` which:
  - Verifies the session learner can see the material (RLS + server-side check).
  - Inserts a row into `material_clicks` (ON CONFLICT DO NOTHING — first click wins).
  - Issues a 302 redirect to the material's external URL.
- After redirect-return, the material renders in its completed state (checkmark + muted styling); progress ring on the dashboard updates accordingly.
- A locked module (i.e. the previous module's compulsory items aren't all clicked) shows a banner and disables every material row. Materials in an optional-only module are always clickable.
- Track filtering applied: modules with `required_for_track = non_tech_only` are hidden from tech-track learners.
- Re-clicking an already-completed material still redirects to the external URL but does not update `clicked_at` (first click wins invariant).
- Click-to-redirect latency ≤ 500ms p95 (matches the success criterion in `project-overview.md`).

## In scope

- `app/(learner)/modules/[id]/page.tsx`.
- `app/api/track-click/route.ts` — the single click-tracking endpoint.
- `components/learner/MaterialRow.tsx` (`'use client'`).
- `components/learner/LockedModuleBanner.tsx`.
- `lib/db/clicks.ts` updated with `recordClick(userId, materialId)`.
- `lib/domain/unlock.ts` exposed to the module page to compute the locked state on the server.
- Type-icon mapping component reading from `ui-context.md`.

## Out of scope

- Authoring exercises / quizzes (out of V1 entirely).
- Material reordering UI (lives in admin CRUD, U8).
- Group submission flow (U9).
- Analytics on click events beyond what's needed for the dashboard / CSV.

## Implementation notes

- `MaterialRow` is `'use client'` only because of the click handler. The form posts to `/api/track-click` with `materialId` as a hidden field; the browser follows the 302. This keeps the row a plain link/form rather than an `onClick` JS dependency — works with JS disabled too.
- The route handler order: `requireLearner()` → validate `materialId` with Zod → load material via `lib/db/materials.ts` → check the learner's track can see this material's module → insert click → fetch URL → 302.
- Locked state computed server-side in the page component using `unlock.ts`. Do NOT compute lock state on the client.
- "Optional only module" edge case: such a module is always unlocked. Clicking optionals never gates anything.
- Tooltip on locked materials: "Unlocks when all compulsory items in <previous module title> are completed."
- Use `revalidatePath('/dashboard')` and `revalidatePath('/modules/[id]')` after a successful click — but the 302 already triggers a fresh page load on return, so this matters mainly for the dashboard.

## Files to create

- `app/(learner)/modules/[id]/page.tsx`.
- `app/api/track-click/route.ts`.
- `components/learner/MaterialRow.tsx`, `MaterialList.tsx`, `LockedModuleBanner.tsx`, `MaterialTypeIcon.tsx`.
- `lib/schemas/click.ts` (Zod schema for `materialId`).

## Dependencies

- 04 (Data Layer) — needs `materials`, `material_clicks`, RLS policies, and `unlock.ts`.
- 05 (Learner Dashboard) — sidebar shell and dashboard linking into module pages.

## Open questions

- "Visited but not opened" — if a learner triggers the redirect but the external URL fails to load, the click still counts. Acceptable? (Default: yes — we're recording intent, not page-load success. Documented in `out of scope`: verification that the learner actually read.)
- Should the module page show the next module preview ("Up next: Week 3 …") when unlocked? (Default: no for V1 — keep the page focused.)
- Track filtering at the route level — should `/modules/[id]` for a hidden module 404 or redirect? (Default: 404 — keeps URL-guessing harmless.)

## Definition of Done

- End-to-end test: seeded learner clicks one compulsory + one optional in Week 1, returns, sees checkmarks and updated dashboard ring.
- After clicking all compulsories in Week 1, Week 2 unlocks.
- Click-to-redirect benchmark: ≤ 500ms p95 across 20 sample clicks in production.
- Direct `/api/track-click?materialId=<bad>` returns 400; with no session, 401; with a foreign-track material, 404.
- `npm run build` green.
