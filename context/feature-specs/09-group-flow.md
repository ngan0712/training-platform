# 09 — Group Flow

## Goal

Let learners self-form into capstone groups before the Week 5 cutoff, submit a project idea, and view their group through the project execution weeks. Admins see the full list of groups.

## Acceptance criteria

- Before the cutoff (`GROUP_SUBMISSION_CUTOFF` in `lib/domain/cutoffs.ts`):
  - A learner without a group sees a "Create or join a group" CTA on the `/group` page and on the dashboard `GroupCard`.
  - **Create a group:** opens a form with `name`, `project_idea` (textarea), and a multi-select `members` (Checkbox list of learners not yet in any group). The submitting learner is auto-included and defaulted as PIC.
  - **Join a group:** lists groups that include the learner's email in their members (chosen by another learner during creation). Confirming joins the group.
  - A learner already in a group sees the group: name, members with PIC badge, project idea, and an **Edit** button (any member can edit `name` / `project_idea` until cutoff). PIC is changed via the PIC toggle in the edit form (exactly one PIC per group, enforced by partial unique index).
- After the cutoff:
  - All edit / create / join buttons are disabled with a clear "Group formation closed" message.
  - Group view becomes read-only.
- `/admin/groups` lists every group: name, member count, PIC name, project idea preview, count of materials clicked by the group's members in the last 7 days (light engagement signal).
- A learner cannot be a member of two groups simultaneously (enforced server-side + DB-side via a unique constraint on `(group_member.user_id)` filtered to active membership).
- All mutations show a Sonner toast; all errors surface clearly (e.g. "You're already in another group").

## In scope

- `/app/(learner)/group/page.tsx` — read view + entry points to create/join/edit.
- `app/(learner)/group/create/page.tsx`, `app/(learner)/group/edit/page.tsx`.
- `app/(admin)/admin/groups/page.tsx`.
- Server Actions for `createGroup`, `joinGroup`, `editGroup`, `setPic`, `leaveGroup`.
- `lib/db/groups.ts`, `lib/db/groupMembers.ts` extended with the mutations and a `getGroupForUser(userId)` helper.
- `lib/domain/cutoffs.ts` already exists from U4; values confirmed pre-launch.
- Components: `GroupCard` (real impl this time, replacing U5 placeholder), `MemberSelect` (Checkbox list of available learners), `PicToggle`, `GroupAdminTable`.

## Out of scope

- Group chat / messaging — Slack is the existing tool.
- Group artifact upload — capstone artifacts live in Google Drive, referenced by URL only post-launch.
- Auto group assignment — fully self-served.
- Group analytics beyond the 7-day click count.

## Implementation notes

- `MemberSelect` filters out learners already in any group. The list comes from a server call inside the form's page (not as a client fetch).
- "Join a group" only appears for groups whose creator (or an existing member, at creation or edit time) added this learner's email. This is the simplest invitation model: explicit add at creation, confirmation by the invitee.
- Atomic create: `createGroup` runs `INSERT INTO groups ... RETURNING id` then `INSERT INTO group_members (...) VALUES (...) ON CONFLICT DO NOTHING` for every invited learner, in a single transaction. The submitter row sets `is_pic = true`; everyone else `is_pic = false`.
- PIC change is `UPDATE group_members SET is_pic = (user_id = $newPicUserId) WHERE group_id = $1`. The partial unique index on `(group_id) WHERE is_pic` enforces exactly one PIC.
- Cutoff guard sits in `lib/domain/cutoffs.ts#isGroupFormationOpen()`. Every mutation Server Action calls it first. Don't rely only on hiding buttons.
- `/admin/groups` engagement count: a single SQL query joining `group_members`, `material_clicks`, filtered to `clicked_at >= NOW() - INTERVAL '7 days'`, grouped by `group_id`.

## Files to create

- `app/(learner)/group/page.tsx`, `create/page.tsx`, `edit/page.tsx`, `actions.ts`.
- `app/(admin)/admin/groups/page.tsx`.
- `components/learner/{GroupCard,MemberSelect,PicToggle,GroupReadView,GroupEditForm}.tsx`.
- `components/admin/GroupAdminTable.tsx`.
- `lib/schemas/group.ts` with `createGroupInput`, `editGroupInput`, `setPicInput`.
- `lib/db/groups.ts` / `lib/db/groupMembers.ts` mutations.

## Dependencies

- 04 (Data Layer) — `groups`, `group_members`, partial unique index, RLS.
- 05 (Learner Dashboard) — sidebar shell + `GroupCard` placeholder slot.
- 07 (Admin Completion View) — admin layout.

## Open questions

- Group size — min / max members? (Default: min 2, max 5 — enforced in `createGroupInput` schema. Confirm with Megan.)
- Can a learner leave a group before cutoff? (Default: yes; `leaveGroup` removes the row. If the leaver is PIC, the action fails until another PIC is set.)
- Can a group be deleted? (Default: yes — only by PIC, only if size = 1 after others leave. Auto-deletes when last member leaves.)
- Should non-PIC members be allowed to edit `project_idea`? (Default: yes — collaborative ownership pre-cutoff. PIC distinction matters mainly for submission accountability later.)

## Definition of Done

- Two seeded learners can create a group, the third can join, the fourth sees the group as "already full / not invited", PIC swap works.
- Cutoff toggle: setting `GROUP_SUBMISSION_CUTOFF` to a past date disables all mutations and shows the read-only banner.
- Admin sees the new group on `/admin/groups`.
- DB constraints fire correctly on attempted second-group membership.
- `npm run build` green.
