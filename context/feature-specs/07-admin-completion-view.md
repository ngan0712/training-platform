# 07 — Admin Completion View

## Goal

Give the three admins a single screen to see cohort-wide progress, drill into a specific learner, and export a flat CSV.

## Acceptance criteria

- `/admin` renders the cohort completion heatmap: rows = learners, columns = modules, cells = compulsory completion status (`done` / `in-progress` / `not-started`) with a numeric `x / N` tooltip.
- Default sort: learners by name. A simple filter chips bar above the heatmap (`All`, `Tech`, `Non-tech`).
- Clicking a learner row opens `/admin/users/[id]`: that user's full timeline by week, with each material listed as clicked / not-clicked + `clicked_at` timestamp.
- A **Export CSV** button on `/admin` downloads `completion.csv` with the columns: `email, name, track, week_number, module_title, material_title, is_compulsory, clicked_at`. One row per (user, material) for every (user, material) pair the user could see — including not-yet-clicked rows where `clicked_at` is empty.
- Learners visiting `/admin` are redirected to `/dashboard` (existing middleware from U3 handles this).
- The page never imports the Supabase SDK directly; all data comes from `lib/db/*`.

## In scope

- `app/(admin)/layout.tsx` (admin sidebar nav variant).
- `app/(admin)/admin/page.tsx` — heatmap + filter chips + export button.
- `app/(admin)/admin/users/[id]/page.tsx` — per-user drill-in.
- `app/api/admin/export-completion/route.ts` — synchronous CSV stream.
- Components: `CompletionHeatmap`, `CompletionCell`, `UserDrillIn`, `TrackFilterChips`, `ExportButton`.
- `lib/db/reports.ts` — `getCohortCompletionMatrix()`, `getUserCompletion(userId)`.

## Out of scope

- Module CRUD (U8).
- Group views (U9).
- Nudges / emails (out of V1).
- Per-material analytics beyond click timestamps.
- Charts. The heatmap is the visualization.

## Implementation notes

- The matrix view fetches everything in one server-side call: `users (where role='learner')`, `modules`, `materials`, `material_clicks`. Cohort is ~100 users × ~24 materials = ~2,400 rows — well within a single request's memory.
- `CompletionCell` color rules: `done` = `--state-success` background; `in-progress` = `--accent-primary` background; `not-started` = `--bg-raised` background with `--text-muted` text. Compulsory-only counts are what color the cell.
- Sticky header + first column on the heatmap table. Use Tailwind's `sticky top-0` / `sticky left-0` with `z-10`.
- CSV generation: a simple template-string streamer; no library. Stream directly to `Response` with `Content-Type: text/csv` and `Content-Disposition: attachment`.
- `getCohortCompletionMatrix` returns a normalized shape: `{ users: User[], modules: Module[], materials: Material[], clicks: Map<userId, Set<materialId>> }`. The component computes cell states from this.

## Files to create

- `app/(admin)/layout.tsx`.
- `app/(admin)/admin/page.tsx`, `app/(admin)/admin/users/[id]/page.tsx`.
- `app/api/admin/export-completion/route.ts`.
- `components/admin/{CompletionHeatmap,CompletionCell,UserDrillIn,TrackFilterChips,ExportButton}.tsx`.
- `lib/db/reports.ts`.
- `lib/schemas/exportFilters.ts`.

## Dependencies

- 04 (Data Layer) — all five additional tables + RLS policies.
- 06 (Module Page & Click Tracking) — click data is what populates the matrix.

## Open questions

- Pagination / virtualization: at ~100 users the matrix is fine as a plain table. Threshold for adding virtualization later? (Default: revisit if Cohort 2 exceeds 250 users.)
- CSV scope: include optional materials by default, or compulsory only? (Default: include both, with the `is_compulsory` column letting the recipient filter in Sheets.)
- Drill-in view editability: can an admin add a click on a learner's behalf? (Per invariants: **no.** Completion is only ever via `/api/track-click`. Drill-in is read-only.)

## Definition of Done

- Seeded data renders the heatmap with no overflow at 1440px and horizontal scroll on mobile.
- CSV export downloads under 1 second for a 100-user cohort.
- Switching track filter chips updates the rendered set immediately (server action with `revalidatePath` or client-side filter — implementer's choice, stay consistent).
- Learner can't access any of these routes.
- `npm run build` green.
