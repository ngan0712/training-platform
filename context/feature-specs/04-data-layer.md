# 04 — Data Layer

## Goal

Create the remaining five tables, their RLS policies, the typed access layer in `lib/db/*`, and a seed script that loads the full 8-week curriculum with materials so later units have real data to render.

## Acceptance criteria

- Tables exist with the columns from `architecture.md`: `modules`, `materials`, `material_clicks`, `groups`, `group_members`. (`users` already exists from U3.)
- `material_clicks` enforces `UNIQUE (user_id, material_id)` at the DB level.
- RLS policies match the matrix in `architecture.md` for every table; verified by running queries as a learner role and an admin role and observing the expected outcomes.
- Seed script populates 8 modules (one per week) with ~3 materials each, mixing compulsory and optional and at least one of each material type (`doc`, `slides`, `reading`, `video`, `form`).
- Every entity has a typed `lib/db/<entity>.ts` exposing the query and mutation functions later units will call. Nothing in the repo outside `lib/supabase` and `lib/db` imports the Supabase SDK.
- Domain helpers (`isModuleUnlocked`, `moduleCompletion`, `dashboardState`) implemented in `lib/domain/` as pure functions with unit tests.
- `npm run seed` works locally against a fresh Supabase project; idempotent (safe to re-run).

## In scope

- Migrations for the five remaining tables.
- RLS policies for all six tables.
- Zod schemas in `lib/schemas/` for every table row + every server-action input.
- `lib/db/{modules,materials,clicks,groups,groupMembers}.ts` typed functions.
- `lib/domain/{unlock,completion,dashboardState,cutoffs}.ts` pure functions.
- Seed script `db/seed.ts` extended from U3 to include modules + materials.
- Vitest set up; unit tests for the domain helpers.

## Out of scope

- UI surfaces — no pages built in this unit beyond what already exists.
- Real curriculum content — seed data uses placeholder Google Doc URLs from a single shared "Curriculum Drafts" folder. Real URLs slot in pre-launch.
- File uploads (none in V1).
- CSV export (U7).

## Implementation notes

- Migrations are numbered: `0002_modules.sql`, `0003_materials.sql`, `0004_material_clicks.sql`, `0005_groups.sql`, `0006_group_members.sql`. Each includes its RLS policies in the same file.
- `material_clicks` uses `ON CONFLICT (user_id, material_id) DO NOTHING` for idempotency — the click endpoint never updates an existing row.
- `groups.project_idea` is `text NOT NULL DEFAULT ''` so newly-formed groups can be created before the idea is written.
- `group_members.is_pic` is `boolean NOT NULL DEFAULT false`; a partial unique index enforces one PIC per group: `CREATE UNIQUE INDEX one_pic_per_group ON group_members(group_id) WHERE is_pic;`
- `lib/domain/unlock.ts` takes `(modules, materials, clicks, userTrack)` and returns the unlocked status per module. Pure; no I/O.
- `lib/domain/cutoffs.ts` exports hardcoded dates: `GROUP_SUBMISSION_CUTOFF`, `COHORT_START`, `COHORT_END`. Placeholders today, real values once HR confirms.
- Use `pgcrypto`'s `gen_random_uuid()` as the default for all `id` columns.

## Files to create

- `db/migrations/0002_modules.sql` … `0006_group_members.sql`.
- `lib/schemas/{module,material,click,group,groupMember}.ts`.
- `lib/db/{modules,materials,clicks,groups,groupMembers}.ts`.
- `lib/domain/{unlock,completion,dashboardState,cutoffs}.ts`.
- `lib/domain/__tests__/{unlock,completion}.test.ts`.
- `db/seed.ts` updated with module + material data.
- `vitest.config.ts`, `package.json` scripts (`test`, `seed`).
- `docs/decisions.md` — entries: "Partial unique index for one PIC per group", "Insert-only clicks via ON CONFLICT DO NOTHING".

## Dependencies

- 03 (Auth) — `users` table and `auth.uid()` must exist for RLS policies to reference.

## Open questions

- Real Google Doc / Slides URLs for seed — when does Megan have them? Block on this before launch (not before this unit ships).
- Are tech-track learners still required to do Weeks 1–2 optionally, or fully skipped? `required_for_track` currently supports `both` and `non_tech_only`; need to confirm there's no `tech_only` case.
- Should `groups` track the cutoff status (`is_locked` bool) or compute it from `cutoffs.ts` at read time? (Default: compute at read — single source of truth.)

## Definition of Done

- All migrations apply cleanly on a fresh Supabase project.
- `npm run seed` produces 8 modules × ~3 materials + 3 admin users + 0 learners.
- Domain helper tests pass (`isModuleUnlocked` for at least: no-clicks, all-compulsory-clicked, mix-of-clicks-but-some-compulsory-missing, optional-only-clicked).
- Manual SQL check: as a learner role, `SELECT * FROM material_clicks` returns only own rows; as admin, all rows.
- `npm run build` green.
