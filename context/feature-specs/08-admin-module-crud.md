# 08 — Admin Module & Material CRUD

## Goal

Let an admin add, edit, reorder, and delete modules and the materials inside them — without a developer. No rich content editor; everything is short metadata + an external URL.

## Acceptance criteria

- `/admin/modules` lists all modules in `week_number, order` order with: title, week, count of compulsory and optional materials, `required_for_track` badge.
- An admin can:
  - Create a new module via a Dialog form: `title`, `description`, `week_number`, `order`, `required_for_track`.
  - Edit an existing module via the same Dialog.
  - Delete a module (with a confirmation Dialog). Deletion blocked if any material in the module has clicks — admin sees a clear error.
  - Reorder modules within a week via simple up/down buttons (no drag-and-drop).
- Clicking a module opens `/admin/modules/[id]/materials` showing its materials list with the same CRUD pattern: title, URL, type (Select), is_compulsory (Switch), order (up/down buttons).
- Deleting a material is blocked if it has clicks; admin gets a clear error.
- All mutations show a toast on success / failure (Sonner).
- Learner dashboard and module pages reflect changes after a hard refresh (server-component data revalidation).
- No SDK calls outside `lib/db/*`.

## In scope

- `app/(admin)/admin/modules/page.tsx`, `app/(admin)/admin/modules/[id]/materials/page.tsx`.
- Server Actions for create/update/delete on both entities.
- Components: `ModuleForm`, `ModuleRow`, `MaterialForm`, `MaterialRow` (admin variant, distinct from the learner one).
- `lib/schemas/{module,material}.ts` extended with input shapes for create/update.
- `lib/db/modules.ts` / `lib/db/materials.ts` extended with `create`, `update`, `delete`, `reorder` functions.
- Delete-safety checks in `lib/db/*`: reject delete if any related click row exists, return a typed error code (`HAS_CLICKS`) the page can render.

## Out of scope

- Rich text editing — `description` is a plain `textarea`.
- Drag-and-drop reordering — up/down buttons only.
- Bulk import / CSV upload of modules — manual entry for Cohort 1.
- Versioning / history of module edits — `updated_at` only.
- Per-cohort modules — single cohort, one set of modules.

## Implementation notes

- All forms are RHF + Zod via shadcn `form`. Server Actions consume the same Zod schema for validation.
- Reorder is a single Server Action `reorderModules(weekNumber, fromOrder, toOrder)` that swaps the two affected rows in a transaction.
- "Delete blocked" pattern: `lib/db/modules.ts#deleteModule` runs `SELECT 1 FROM material_clicks JOIN materials ON ... WHERE module_id = $1 LIMIT 1`. If any row, return `{ ok: false, error: 'HAS_CLICKS' }`. The page renders a Dialog warning the admin to nullify clicks first or to archive instead. (Archive is out of scope for V1 — clearly state the workaround in the error: "delete all click data for this module via the database before deleting".)
- `revalidatePath('/dashboard')` and `revalidatePath('/modules/[id]', 'layout')` after every successful mutation.

## Files to create

- `app/(admin)/admin/modules/page.tsx`, `actions.ts`.
- `app/(admin)/admin/modules/[id]/materials/page.tsx`, `actions.ts`.
- `components/admin/{ModuleForm,ModuleRow,ModuleListTable,MaterialForm,MaterialAdminRow,MaterialListTable,ConfirmDeleteDialog,ReorderButtons}.tsx`.
- Update `lib/db/modules.ts`, `lib/db/materials.ts` with mutation functions.
- Update `lib/schemas/{module,material}.ts` with input schemas.

## Dependencies

- 04 (Data Layer) — tables, schemas, base DB functions.
- 07 (Admin Completion View) — admin layout and sidebar nav.

## Open questions

- Should reorder be week-scoped or global? (Default: week-scoped — order resets within each week.)
- Adding the same material URL twice across different modules — allowed? (Default: allowed; an admin might intentionally reuse a Doc in two weeks. No uniqueness constraint on `url`.)
- Soft delete vs hard delete — would archived modules make sense post-launch? (Default: hard delete with the has-clicks guard. Add `archived` flag later only if needed.)

## Definition of Done

- An admin can author a new module + 3 materials in under 2 minutes without touching the database.
- Reorder buttons swap rows correctly within a week; cross-week moves are not exposed.
- Delete with clicks → blocked with clear error; delete without clicks → succeeds.
- Toast appears on every mutation outcome.
- Learner dashboard reflects new module after refresh.
- `npm run build` green.
