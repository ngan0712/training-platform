# 09 — Group Flow

## Goal

Let learners choose to do their capstone individually or self-form into a group before the Week 5 cutoff, submit a project idea, and view their participation mode through the project execution weeks. Admins see all participants — grouped and individual — in one table.

## Acceptance criteria

### Participation mode selection

- Every learner must explicitly choose a participation mode before the cutoff. The default state is **undecided** (not automatically "individual").
- On `/group` and on the dashboard `GroupCard`, an undecided learner sees two CTAs:
  - **"Do it solo"** — opts in as an individual participant; no further form required.
  - **"Join or create a group"** — enters the group flow.
- A learner may switch modes before the cutoff: a solo learner can enter the group flow; a group member can leave and switch to solo.
- Switching from group to solo triggers `leaveGroup` (with the usual PIC-must-transfer guard). Switching from solo to group clears the solo flag and enters the group flow.

### Group flow (before cutoff)

- **Search:** The `/group` page shows a search bar that filters across group names and member names. Results show group cards with name, current members, and size. A learner can request to join a visible group from search results.
- **Create a group:** Opens a form with `name`, `project_idea` (textarea), and a searchable member picker (`MemberSelect`). The member picker has a text input that filters available learners by name in real time; selecting/deselecting adds or removes them from the invite list. The submitting learner is auto-included and defaulted as PIC.
- **Join a group:** A learner can join any group visible in search (not yet at max size) by clicking "Request to join." Because membership is open (not invite-only), the join is immediate; no PIC approval step is needed.
- **Edit group (PIC only for membership):** Any member can edit `name` and `project_idea`. Only the PIC can add or remove other members. PIC is changed via the PIC toggle in the edit form (exactly one PIC per group, enforced by partial unique index).
- A learner already in a group sees the group: name, members with PIC badge, project idea, and an **Edit** button.

### After the cutoff

- All edit / create / join / mode-switch buttons are disabled with a clear "Group formation closed" message.
- Undecided learners are automatically treated as individual participants at cutoff time (server-side fallback; no DB row needed).
- Group view and solo view become read-only.

### Admin — `/admin/groups`

Lists every learner's capstone participation. Columns:

| Column           | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| **Members**      | List of member names (single name for individual participants) |
| **Size**         | Member count (1 for individual participants)                   |
| **Group name**   | Group name, or empty for individual participants               |
| **Project idea** | Full text (truncated with tooltip)                             |

Additional signal: count of materials clicked by the participant(s) in the last 7 days (shown as a sub-column or tooltip on the Members cell — light engagement signal).

- A learner cannot be a member of two groups simultaneously (enforced server-side + DB-side via a unique constraint on `(group_member.user_id)` filtered to active membership).
- All mutations show a Sonner toast; all errors surface clearly (e.g. "You're already in another group", "Only the PIC can add or remove members").

## In scope

- `/app/(learner)/group/page.tsx` — mode selection CTA + read view + search + entry points to create/join/edit.
- `app/(learner)/group/create/page.tsx`, `app/(learner)/group/edit/page.tsx`.
- `app/(admin)/admin/groups/page.tsx`.
- Server Actions: `chooseIndividual`, `createGroup`, `joinGroup`, `editGroup`, `setPic`, `leaveGroup`, `switchToIndividual`.
- `lib/db/groups.ts`, `lib/db/groupMembers.ts` extended with the mutations and a `getGroupForUser(userId)` helper.
- `lib/db/participationMode.ts` — `getParticipationMode(userId)` returning `'undecided' | 'individual' | 'group'`.
- `lib/domain/cutoffs.ts` already exists from U4; values confirmed pre-launch.
- Components: `GroupCard` (real impl replacing U5 placeholder), `MemberSelect` (searchable picker with real-time name filter), `PicToggle`, `GroupSearchBar`, `GroupAdminTable`.

## Out of scope

- PIC approval step for join requests — joins are open / immediate.
- Group chat / messaging — Slack is the existing tool.
- Group artifact upload — capstone artifacts live in Google Drive, referenced by URL only post-launch.
- Auto group assignment — fully self-served.
- Group analytics beyond the 7-day click count.

## Implementation notes

- **Participation mode** is stored as a nullable `participation_mode` column on the `users` table (`'individual' | 'group' | NULL`). `NULL` = undecided. At cutoff, server-side logic treats `NULL` as `'individual'` without writing to the DB — avoids a migration-time backfill.
- **`MemberSelect`** renders a controlled text input that filters the available-learner list from the server by name prefix. The full list is fetched once at page load (server component); client-side filtering against that list avoids extra round-trips. Selecting a learner adds them to the invite array; deselecting removes them.
- **Group search** on `/group` is a client-side filter over the groups list (fetched at page load). It matches group name or any member's display name, case-insensitive.
- **Open join model:** any learner can join any group under the max size limit. The old invite-only model (PIC adds email at creation) is removed.
- **PIC-only member management in edit:** `editGroup` validates that the calling user's `group_members.is_pic = true` before processing add/remove operations. Name/project idea edits remain open to all members.
- Atomic create: `createGroup` runs `INSERT INTO groups ... RETURNING id` then `INSERT INTO group_members (...) VALUES (...) ON CONFLICT DO NOTHING` for every invited learner, in a single transaction. The submitter row sets `is_pic = true`; everyone else `is_pic = false`.
- PIC change: `UPDATE group_members SET is_pic = (user_id = $newPicUserId) WHERE group_id = $1`. The partial unique index on `(group_id) WHERE is_pic` enforces exactly one PIC.
- Cutoff guard in `lib/domain/cutoffs.ts#isGroupFormationOpen()`. Every mutation Server Action calls it first — do not rely solely on hiding buttons.
- `/admin/groups` engagement count: a single SQL query joining `group_members`, `material_clicks`, filtered to `clicked_at >= NOW() - INTERVAL '7 days'`, grouped by `group_id`. Individual participants are joined via `users` directly.

## Files to create

- `app/(learner)/group/page.tsx`, `create/page.tsx`, `edit/page.tsx`, `actions.ts`.
- `app/(admin)/admin/groups/page.tsx`.
- `components/learner/{GroupCard,MemberSelect,PicToggle,GroupReadView,GroupEditForm,GroupSearchBar}.tsx`.
- `components/admin/GroupAdminTable.tsx`.
- `lib/schemas/group.ts` with `createGroupInput`, `editGroupInput`, `setPicInput`.
- `lib/db/groups.ts` / `lib/db/groupMembers.ts` mutations.
- `lib/db/participationMode.ts`.

## Dependencies

- 04 (Data Layer) — `groups`, `group_members`, partial unique index, RLS; add `participation_mode` column to `users`.
- 05 (Learner Dashboard) — sidebar shell + `GroupCard` placeholder slot.
- 07 (Admin Completion View) — admin layout.

## Open questions

- Group size — min / max members? (Default: min 2, max 5 — enforced in `createGroupInput` schema. Confirm with Megan.)
- Can a learner leave a group before cutoff? (Default: yes; `leaveGroup` removes the row. If the leaver is PIC, the action fails until another PIC is set first.)
- Can a group be deleted? (Default: yes — only by PIC, only if size = 1 after others leave. Auto-deletes when last member leaves.)
- Should non-PIC members be allowed to edit `project_idea`? (Default: yes — collaborative ownership pre-cutoff. PIC distinction applies to membership changes only.)
- Should undecided learners at cutoff be auto-set to individual in the DB, or remain NULL with a server-side fallback? (Default: NULL + fallback — avoids a bulk write at an unpredictable moment.)

## Definition of Done

- Undecided learner can choose solo or group; a group member can switch to solo (leave group first); a solo learner can switch to group.
- Group search returns results by group name and member name; joining from search results works.
- Member picker in create/edit filters by name in real time; selecting/deselecting updates the invite list.
- PIC can add/remove members in edit; non-PIC members cannot.
- Two seeded learners can create a group, the third can join via search, PIC swap works.
- Cutoff toggle: setting `GROUP_SUBMISSION_CUTOFF` to a past date disables all mutations and shows the read-only banner.
- Admin `/admin/groups` shows grouped and individual participants in the correct columns; Group name is empty for solo participants.
- DB constraints fire correctly on attempted second-group membership.
- `npm run build` green.
