# 14 — Admin User Management

## Goal

Give admins write control over user accounts: assign which content track a user belongs to, promote learners to admin, and hard-reset a user's learning history. Surfaces recent activity directly in the users table so admins can spot inactive learners at a glance without drilling in.

## Acceptance criteria

### Users table (`/admin/users`)

- New route in the admin panel, linked from the sidebar between Cohort and Curriculum (icon: `Users`).
- Displays all registered users in a searchable table (client-side filter on name/email; paginate only if row count exceeds 100).
- Columns:

  | Column        | Source                                                                                                     | Notes                                   |
  | ------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------- |
  | Name          | `users.name`                                                                                               | Sortable                                |
  | Email         | `users.email`                                                                                              |                                         |
  | Role          | `users.role`                                                                                               | `learner` / `admin` badge               |
  | Track         | `users.track`                                                                                              | `tech` / `non_tech` / `unassigned` chip |
  | Last activity | Latest timestamp across `clicks.clicked_at`, `exercise_submissions.updated_at`, `quiz_attempts.created_at` | "No activity" if no records             |
  | Joined        | `users.created_at`                                                                                         | Formatted date                          |
  | Actions       | `…` overflow menu                                                                                          | See below                               |

- Each row also has a "View progress" link that navigates to the existing `/admin/users/[id]` drill-in.

### Action: Assign Track

- Overflow menu contains a sub-menu or inline dropdown to set track: `Tech` / `Non-tech` / `Unassigned`.
- Saves immediately (optimistic update + server PATCH).
- Disabled for users with `role === "admin"` (admins are not on a track).
- Reassigning track does not clear existing progress on modules the user already accessed.

### Action: Promote to Admin

- Overflow menu item: **Promote to admin**.
- Disabled (greyed out) if `role === "admin"` already.
- Requires a confirmation dialog before proceeding:
  - Warning: _"This cannot be undone from the admin panel. [Name] will gain full admin access immediately after their next sign-in."_
  - Two buttons: **Cancel** and **Promote**.
- After confirmation, sets `users.role = "admin"` via server PATCH.
- The promoted user's existing session is unaffected until they sign out and back in (Supabase JWT refresh required).

### Action: Clear History

- Overflow menu item: **Clear history** (destructive/red style).
- Requires a two-step confirmation dialog:
  1. Lists exactly what will be deleted: material clicks, exercise submissions and answers, quiz attempts.
  2. Requires the admin to type the target user's email address before the **Clear** button enables.
- On confirm, hard-deletes all rows where `user_id = target` from: `clicks`, `exercise_submissions`, `exercise_answers`, `quiz_attempts`.
- Does not affect the user account, role, or track.
- Admin cannot clear their own history (server-side guard: `target.id !== session.user.id`).
- Irreversible — no soft-delete or archive.

## API routes

All handlers live under `app/api/admin/users/[id]/`. Each verifies the caller has `role === "admin"` server-side before executing.

| Method   | Path                            | Body                                      | Effect                                                                     |
| -------- | ------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `PATCH`  | `/api/admin/users/[id]/track`   | `{ track: "tech" \| "non_tech" \| null }` | Updates `users.track`                                                      |
| `PATCH`  | `/api/admin/users/[id]/promote` | —                                         | Sets `users.role = "admin"`                                                |
| `DELETE` | `/api/admin/users/[id]/history` | —                                         | Hard-deletes clicks, exercise_submissions, exercise_answers, quiz_attempts |

## In scope

- New `/admin/users` route and `UserManagementTable` component.
- Last-activity column computed via a single query (MAX across three tables) returned alongside user rows.
- Three API route handlers with server-side auth checks.
- Confirmation dialogs for promote and clear history actions (reuse existing `ConfirmDeleteDialog` pattern or extend it for the email-challenge variant).
- Sidebar nav link addition.

## Out of scope

- Last login column (requires joining `auth.users` or a new DB view; deferred until needed).
- Deactivate / suspend account (requires disabling the Supabase auth user; deferred).
- Bulk actions (e.g. assign track to all unassigned users).
- Invite / create user (users self-register via Google SSO).
- Demotion — admin role cannot be removed through the UI.
- Partial history clear (e.g. quiz attempts only).
- Email or in-app notifications for any of these actions.
- Audit log (if compliance requires one later, add `admin_audit_log` table).
