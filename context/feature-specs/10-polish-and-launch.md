# 10 — Polish & Launch

## Goal

Close the gap between "works on my machine" and "ready for 100 employees on June 1": empty / error / loading states, mobile reflow, admin guide, cohort onboarding email, and a sign-off checklist run by 2–3 friendly testers.

## Acceptance criteria

- Every page has a meaningful empty state (no clicks yet, no group yet, no learners yet) and a meaningful error state. No raw stack traces reach the user.
- Every server-component page has a co-located `loading.tsx` and `error.tsx`.
- Mobile reflow verified at 375px: sidebar collapses to a top bar, tables horizontally scroll within their container, dashboard cards stack.
- 2–3 friendly testers (across tech + non-tech) complete the full happy path: sign in → onboarding → Week 1 module → click compulsory items → see Week 2 unlock → form a group → submit a project idea. All blocking issues fixed.
- `docs/admin-guide.md` written: how to add a module, how to deal with a stuck learner, how to export the CSV, how to interpret the heatmap.
- `docs/cohort-onboarding.md` drafted: the email that goes to the cohort the day before June 1 — links, expectations, who to ping in Slack.
- Production environment hardened: env vars set in Vercel, Supabase project on at least the Pro plan **only if** free-tier limits are at risk for a 100-user cohort (default: stay on free), backups confirmed.
- No `console.error` or unhandled rejections on the happy path.
- Lighthouse on `/dashboard` and `/modules/[id]`: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 95, SEO is ignored (internal app).
- `npm run build` green; CI green on `main`.

## In scope

- Empty-state and error-state components per page.
- `loading.tsx` + `error.tsx` per route segment.
- Mobile reflow pass.
- Two short docs: `admin-guide.md`, `cohort-onboarding.md`.
- Buffer for bug fixes surfaced by testers.
- A pre-launch checklist run by Megan: env vars verified, seed data is real curriculum URLs (not placeholders), admin allowlist contains the right three emails, cutoff date is the agreed Week 5 cutoff.

## Out of scope

- New features. If a tester surfaces a feature request, log it as a post-launch item in `progress-tracker.md` and move on.
- Tablet-specific layout work.
- Analytics / telemetry.
- A11y audit beyond Lighthouse.
- Performance work beyond what Lighthouse demands.

## Implementation notes

- Build a single `EmptyState` component in `components/shared/` taking `{ icon, title, description, action? }` and reuse it everywhere.
- Error boundaries (`error.tsx`) log the error to Vercel and render a generic "Something went wrong" with a "Reload" button. Never expose the message to the user.
- The admin guide should include screenshots — take them from the deployed preview, not local dev.
- The cohort onboarding email is plain Markdown; HR / Megan converts it to the actual email tool of choice. Don't build email sending.
- Tester recruitment: aim for one tech + one non-tech + one admin (Data Lead or Boss).

## Files to create / modify

- `app/(learner)/{dashboard,modules/[id],group}/{loading,error}.tsx`.
- `app/(admin)/admin/{,users/[id],modules,modules/[id]/materials,groups}/{loading,error}.tsx`.
- `components/shared/{EmptyState,ErrorBoundaryFallback}.tsx`.
- `docs/admin-guide.md`, `docs/cohort-onboarding.md`, `docs/launch-checklist.md`.

## Dependencies

- 01–09 — everything else must be shipped before this unit starts.

## Open questions

- Final cohort kickoff date (the "June 2026" in `project-overview.md` is approximate). Need exact date to seed `COHORT_START` in `cutoffs.ts`. Block on this 5 days before launch at the latest.
- Whether to put up a "you're early — come back on <date>" page before kickoff, or let learners explore early. (Default: let them explore — early sign-ins reduce day-one load.)
- What happens to data at end of program: do clicks and groups persist for HR records, or get archived? (Default: persist; CSV export is the archive.)

## Definition of Done

- Pre-launch checklist signed off (Megan).
- Three testers' happy-path runs documented in `docs/launch-checklist.md`.
- Production URL is the URL announced to the cohort.
- Admin guide is short enough that a new admin can onboard in 15 minutes.
- Megan has a written rollback plan: how to revert a bad deploy, how to disable sign-ins via Supabase, who to ping if the database goes down.
