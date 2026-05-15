# 02 — Foundations

## Goal

Ship a deployable Next.js app skeleton with the folder structure, env handling, lint/typecheck gates, and CI/CD set up. A "hello world" page must render on a stable Vercel URL with previews per PR.

## Acceptance criteria

- Production URL serves a `/` page that renders "Hello — AI Training Platform".
- Every PR opens a Vercel preview URL automatically.
- `npm run build`, `npm run lint`, `npm run typecheck` all green locally and in CI.
- `.env.local.example` committed; `.env.local` is gitignored.
- Folder skeleton matches `architecture.md` (empty placeholder folders for `lib/db`, `lib/auth`, `lib/schemas`, `lib/domain`, `app/(learner)`, `app/(admin)`, etc.).
- `docs/decisions.md` created and pre-seeded with the entries for stack choice and design tokens.

## In scope

- Next.js 14+ App Router project, TypeScript strict.
- Vercel project linked to the repo.
- GitHub Actions workflow: typecheck + lint + build on PR.
- Prettier + ESLint with the Next.js + Tailwind plugins.
- Pre-commit hook (Husky + lint-staged) running Prettier + ESLint on staged files.
- Empty placeholder folders + index files where useful.
- A single root `page.tsx` rendering the hello-world surface.
- `.env.local.example` listing every env var the project will need (Supabase URL + anon key + service key placeholders).

## Out of scope

- Auth (U3).
- Database tables (U4).
- Any learner or admin pages beyond hello world (U5+).
- Sidebar shell (built in U5 alongside the dashboard).

## Implementation notes

- Use `npx create-next-app@latest --typescript --tailwind --app --eslint --src-dir=false`.
- Path alias: `@/*` → repo root.
- `next.config.js`: `reactStrictMode: true`, `experimental: { typedRoutes: true }`.
- ESLint: extend `next/core-web-vitals`, add `eslint-plugin-tailwindcss`.
- Husky: `npx husky init` then a `pre-commit` script running `lint-staged`.
- GitHub Action: single job `ci`, runs on `pull_request`, steps = checkout → setup-node 20 → `npm ci` → `npm run typecheck` → `npm run lint` → `npm run build`.

## Files to create

- `package.json` (scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `format`).
- `tsconfig.json`, `next.config.js`, `.eslintrc.json`, `.prettierrc`, `.prettierignore`.
- `app/page.tsx`, `app/layout.tsx` (already exists from 01).
- `.env.local.example`.
- `.github/workflows/ci.yml`.
- `.husky/pre-commit`, `lint-staged.config.js`.
- `docs/decisions.md` with seed entries.
- Empty folders with `.gitkeep`: `lib/db`, `lib/auth`, `lib/schemas`, `lib/domain`, `lib/supabase`, `db/migrations`, `components/learner`, `components/admin`, `components/shared`.

## Dependencies

- 01 (Design System) — globals.css + fonts + shadcn must be in place so the hello-world page renders with tokens.

## Open questions

- Node version pin — 20 LTS or 22? (Default: 20 LTS — matches Vercel default.)
- Package manager — npm, pnpm, or bun? (Default: npm — least friction with Vercel and shadcn CLI.)

## Definition of Done

- Hello world live on a stable Vercel URL.
- PR opened → preview URL posted automatically.
- CI status check is required to merge.
- `git log` shows one commit per concern (scaffold, lint config, CI workflow, husky hook).
