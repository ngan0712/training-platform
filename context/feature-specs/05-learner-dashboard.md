# 05 — Learner Dashboard

## Goal

Build the learner's home: sidebar shell, onboarding intake on first login, dashboard page with progress ring, 8-week timeline strip, and a "Continue" card pointing at the current module.

## Acceptance criteria

- A new learner signing in for the first time lands on `/onboarding`, confirms their name, and picks a track (`tech` / `non_tech`) via a RadioGroup. Submitting writes `users.name` and `users.track` and redirects to `/dashboard`.
- A returning learner with `track` set skips onboarding and goes straight to `/dashboard`.
- The sidebar renders on every learner page: logo, learner nav (Dashboard, Modules, My Group), profile menu at the bottom with avatar + name + sign-out. Admin links visible only if `role = admin`.
- `/dashboard` renders:
  - Progress ring showing `clickedCompulsoryCount / totalCompulsoryCount` for the learner's track.
  - 8-week timeline strip with one node per module, each in one of three states: `done`, `current`, `locked`. Track filtering applied.
  - Continue card naming the current module + a "Open module" link to `/modules/[id]`.
  - Group card placeholder (rendered, populated in U9).
- Locked modules show a lock icon + tooltip ("Finish the compulsory items in <previous module> to unlock").
- Mobile reflow works: sidebar collapses to a top bar with a menu button.
- No client-side admin checks anywhere on this surface.

## In scope

- `app/onboarding/page.tsx` + server action to write name + track.
- `app/(learner)/layout.tsx` with the sidebar shell.
- `app/(learner)/dashboard/page.tsx`.
- Components: `SidebarNav`, `ProfileMenu`, `ProgressRing` (SVG, no extra dep), `TimelineStrip`, `ContinueCard`, `GroupCard` (placeholder).
- Use `lib/domain/dashboardState.ts` to compute everything; no logic in the page component.
- Empty state: if the learner has zero clicks, the Continue card points at the first module of Week 1 of their track and the progress ring reads `0 / N`.

## Out of scope

- Module page (U6).
- Group submission (U9) — `GroupCard` is a placeholder.
- Admin nav links beyond visibility logic (U7).
- Notifications, announcements, nudges.

## Implementation notes

- Server Components only for data fetching. Only `'use client'` files: `SidebarNav` (active route highlighting), `ProfileMenu` (DropdownMenu), `SignOutButton`.
- `ProgressRing` is a pure SVG circle with `strokeDasharray` driven by props — no animation library.
- `TimelineStrip` is a horizontal scroll on mobile, flex row on desktop. Each node is a `<Link>` to its module, with `pointer-events: none` and grey styling when locked.
- Onboarding form uses RHF + Zod via shadcn `form`. Track options shown with `radio-group`.
- Active sidebar item determined via `usePathname()`.

## Files to create

- `app/onboarding/page.tsx`, `app/onboarding/actions.ts`.
- `app/(learner)/layout.tsx`, `app/(learner)/dashboard/page.tsx`.
- `components/shared/SidebarNav.tsx`, `ProfileMenu.tsx`, `PageHeader.tsx`.
- `components/learner/{ProgressRing,TimelineStrip,ContinueCard,GroupCard,ModuleNode}.tsx`.
- `lib/schemas/onboarding.ts`.

## Dependencies

- 04 (Data Layer) — needs `modules`, `materials`, `material_clicks`, `users.track`, and `dashboardState()`.

## Open questions

- Default track for the very first time a brand-new learner lands (before completing onboarding)? (Default: no default; force the picker — onboarding can't be skipped.)
- Should the progress ring count optional clicks too as a secondary stat? (Default: no — keep the headline number unambiguous; admins see both in U7.)
- What does "current module" mean if every compulsory item in the latest unlocked module is already clicked but the next isn't unlocked yet (i.e. no unfinished compulsories anywhere)? (Default: show the next compulsory module by `week_number, order` — even if not yet "unlocked" per cohort calendar.)

## Definition of Done

- Two seeded test users (one fresh learner, one mid-program) render expected dashboard states.
- Mobile (375px) and desktop (1440px) both render without horizontal scroll bugs.
- Lighthouse accessibility ≥ 90 on `/dashboard`.
- No `console.error` on the happy path.
