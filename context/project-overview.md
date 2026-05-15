# Project Overview — AI Training Platform

## Overview

The AI Training Platform is an internal web application that serves as the single front door for Pelago's company-wide AI training program. Every employee is enrolled in a single 6–8 week cohort, kicking off June 2026. Curriculum materials are hosted externally — Google Docs, Google Slides, public readings, YouTube videos — and surfaced inside the platform as a list of links per module. Each material is flagged either **compulsory** or **optional**. Clicking a compulsory link records completion of that item; a module is complete when all of its compulsory items have been opened. The platform is a thin tracking layer that handles authentication, shows each learner where they are in the program, gates progression on compulsory completion, surfaces a cohort-wide completion view for admins, and collects pre-capstone group formation. It is built with Next.js, Supabase, and Vercel, deployed at a single internal URL, and accessed via Google SSO restricted to `@pelago.co` accounts.

## Goals

1. Give every Pelago employee one clear place to follow the AI training program week by week.
2. Track per-person, per-material completion reliably enough to support reporting on the compulsory program.
3. Ship a working V1 before the June 2026 cohort kickoff (under 4 weeks of solo, AI-assisted build).
4. Never own long-form content — all materials are external links (Google Docs, Slides, articles, videos).
5. Capture pre-capstone group formation (groups + project ideas) inside the platform so admins do not chase spreadsheets.
6. Stay cheap to run: free tier on Vercel + Supabase, no third-party trackers.
7. Be replaceable: if Cohort 2 needs a different tool, all learner data must be exportable as CSV.

## Core user flow

1. Employee opens the platform URL in their browser.
2. Clicks **Sign in with Google**.
3. Supabase Auth checks the email domain; non-`@pelago.co` accounts are rejected with a clear message.
4. First-time learners see a one-screen intake: confirm name, pick track (`tech` or `non-tech`). Returning learners skip this step.
5. Learner lands on the **Dashboard**: progress ring (X of N compulsory items complete), the full 8-week timeline strip, and a "Continue" card pointing to the current module.
6. Learner clicks into the current **Module page**: title, week number, short description, and an ordered list of **materials**. Each material shows its title, type (Doc / Slides / Reading / Video / Form), and a **Compulsory** or **Optional** badge.
7. Learner clicks a material link. The link opens in a new tab and the platform records that material as completed for that learner (timestamp logged server-side at click time).
8. Completed materials change visual state (checkmark, muted styling). The module's progress bar updates.
9. Once **all compulsory materials in the current module are clicked**, the next module unlocks on the dashboard and timeline. Optional materials never gate progression.
10. At Week 5, the learner sees the **Group submission** form: pick group name, list members (multi-select from cohort), enter the project idea. One submission per group; any group member can edit until the deadline.
11. Weeks 6–7 are project execution weeks — no platform submissions required. Group page shows teammates and the saved project idea.
12. At end of program, the dashboard shows a "Program complete" state and links to an external Google Form for the personal reflection.
13. Admins (Megan / Data Lead / Boss) log in via the same flow and see the **Admin** section in the sidebar: cohort completion heatmap (user × module), per-user drill-in, module + materials CRUD form, group list, CSV export.

## Features

### Learner-facing

- Google SSO sign-in restricted to `@pelago.co`.
- First-login intake (name confirm + track selection).
- Dashboard with compulsory-progress ring, 8-week timeline strip, current-module CTA, locked / unlocked states.
- Module pages listing all materials with type icon and Compulsory / Optional badge.
- Click-to-complete: a click on a material link records completion server-side and opens the link in a new tab.
- Visual state for completed materials (checkmark, muted) and locked modules (grey, tooltip explaining what to finish).
- Group page: view your group's name, members, PIC, and saved project idea.
- Group submission form (pre-Week 6).

### Admin-facing

- Sidebar admin section, visible only to users with `role = admin`.
- Three admin accounts seeded by email: Megan, Data Lead, Boss.
- Cohort completion heatmap: every learner × every module, with status cells (compulsory %, complete / in-progress / not started).
- Per-user drill-in: one learner's full progress timeline, including which compulsory items are still pending.
- Module CRUD: form to add / edit / reorder modules (week number, order, title, description, required-for-track flag).
- Material CRUD nested under each module: title, URL, type (Doc / Slides / Reading / Video / Form), Compulsory / Optional flag, order.
- Group list: read-only view of all groups, members, PICs, project ideas.
- CSV export of per-learner, per-material completion data.

### Platform / infrastructure

- Google OAuth via Supabase Auth + domain allowlist enforced server-side.
- Postgres schema with Row-Level Security: learners read/write only their own click records; admins have full read.
- Click-tracking endpoint: server action records the completion event, then 302-redirects the browser to the external material URL.
- Seed script for initial modules, materials, and the three admin emails.
- Vercel preview deployments per PR.

## In scope (V1)

- Google SSO with `@pelago.co` domain restriction.
- Two roles: `learner`, `admin` (admin = Megan, Data Lead, Boss — three hardcoded emails).
- Two tracks: `tech`, `non_tech` (drives which Week 1–2 modules are required).
- Single hardcoded cohort (no multi-cohort support).
- Materials hosted externally on Google Docs, Google Slides, public web pages, YouTube, or Google Forms.
- Each material flagged **compulsory** or **optional**.
- Click-based completion: a click on a material link records completion at that moment.
- Module unlock rule: all compulsory materials in the prior module must be clicked before the next module unlocks.
- Pre-Week-6 group + project idea submission stored in the platform.
- Admin completion dashboard + module / material CRUD + CSV export.
- Sidebar layout, shadcn/ui + Tailwind, warm-but-clean visual style.
- Desktop-first responsive (works on mobile, not optimized).

## Out of scope (V1)

- Hosting curriculum content inside the platform (no markdown body, no embedded video, no quizzes).
- In-platform MCQs or LLM-graded free-text exercises.
- "Mark complete" button or any self-reported completion (completion is click-based only).
- Verification that the learner actually read / watched the material (a click counts; honor system).
- HR involvement — HR is not an admin and receives no special role.
- In-platform capstone review queue with pass / revise / fail workflow.
- File upload for capstone artifacts (use a Google Drive link in a form).
- Auto-generated completion certificates.
- Rich content authoring UI / WYSIWYG / markdown editor.
- Reflection collection in-platform (use a Google Form).
- Cohort management / multi-cohort support.
- Announcements, notifications, or nudges (use Slack).
- Mobile-optimized layouts beyond basic reflow.
- Analytics / third-party trackers.
- Public sign-up — only `@pelago.co` Google accounts.
- Manual password auth, magic links, SAML / Okta.
- Slack OAuth login option.
- Auto-routing of passed capstones into SlackHive.
- Auto group assignment (groups self-form via the submission form).

## Success criteria

- By June 1, 2026: platform deployed at a stable URL, every Pelago employee can sign in via Google SSO, the Week 1 module page renders, and all Week 1 materials are linked and click-trackable.
- Within 7 days of kickoff: ≥ 90% of the cohort has signed in at least once.
- By end of Week 5: ≥ 80% of learners have clicked through all compulsory materials in Weeks 1–4; 100% of cohort members are listed in a group with a submitted project idea.
- By end of Week 8: completion CSV exportable by an admin in under one minute, with no manual data cleanup required.
- Zero production incidents related to unauthorized access (non-`@pelago.co` sign-ins, learner reaching admin pages).
- Click-to-completion latency: ≤ 500ms from click to redirect for the external material URL.
- Solo build hours: V1 shipped in ≤ 80 engineering hours across 4 calendar weeks.
- No paid SaaS line items: stays on Vercel + Supabase free tiers for the duration of Cohort 1.
