# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. The context files in `/code/training-platform/context/` define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. When in doubt, re-read `project-overview.md`, `architecture.md`, and `code-standards.md` before writing code. The platform ships in under 4 weeks by a solo, AI-assisted builder; every shortcut taken now must be tracked in `progress-tracker.md` so it can be revisited.

## Scoping Rules

- Work on one feature unit at a time (units U1–U9 are defined in `progress-tracker.md`).
- Prefer small, verifiable increments over large speculative changes. A change should be deployable to Vercel preview and clickable end-to-end within a single session.
- Do not combine unrelated system boundaries in a single implementation step. Learner pages, admin pages, the auth callback, and the click-tracking endpoint are separate boundaries.
- Touch `/lib/db/*` in its own commit; touch UI in its own commit. Mixing schema changes with UI changes hides bugs.

## When to Split Work

Split an implementation step if it combines:

- UI changes and database schema or migration changes
- Learner-surface changes and admin-surface changes
- The click-tracking endpoint and any other route
- Auth / authorization changes and feature changes
- Behavior not clearly defined in `project-overview.md` or `architecture.md`

If a change cannot be verified end to end on a Vercel preview within ~30 minutes, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file first, then implement.
- If a requirement is missing, add it under **Open Questions** in `progress-tracker.md` and stop the current unit until it is answered.
- Never silently default. If the spec does not say "what happens when a learner clicks an already-completed material", write it down before coding it.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn-generated UI primitives. Use the shadcn CLI to add components; do not hand-edit.
- `db/migrations/*` once merged to `main` — migrations are append-only. New schema changes ship as new numbered migrations.
- `db/seed.ts` admin email list — adding or removing an admin requires explicit approval and a new commit dedicated to that change.
- `docs/decisions.md` — append-only. Never edit prior entries; only add new dated entries.
- `package.json` — do not add a new dependency without first recording a one-line justification in `docs/decisions.md`.

## Keeping Docs in Sync

Update the relevant context file in the same PR whenever implementation changes:

- System architecture or folder boundaries → `architecture.md`
- Storage model, table shape, or RLS policy → `architecture.md`
- Coding conventions or new lint rules → `code-standards.md`
- Visual tokens, spacing, or layout → `ui-context.md`
- Feature scope (added, cut, deferred) → `project-overview.md`
- Progress, decisions, blockers → `progress-tracker.md`

A PR that changes behavior without updating the matching doc is incomplete.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope, verified on a Vercel preview URL.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work (moved from **In Progress** to **Completed**).
4. `npm run build`, `npm run lint`, and `npm run typecheck` all pass.
5. Any new dependency is justified in `docs/decisions.md`.
6. Any deferred or shortcut work is captured under **Open Questions** or **Next Up**.
