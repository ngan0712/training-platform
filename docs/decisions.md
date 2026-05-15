# Architecture Decision Log

Append-only. New entries go at the bottom.

---

## ADR-001 — Stack: Next.js + Supabase + Vercel

**Date:** 2026-05-15
**Status:** Accepted

**Decision:** Next.js (App Router, TypeScript) for the frontend/API layer; Supabase for auth + Postgres + optional storage; Vercel for hosting and CI/CD previews.

**Rationale:** Best AI-coding-assistant ecosystem for a solo build. Auth + Postgres + storage in a single platform. Free tier covers Cohort 1. Vercel's per-PR preview URLs are a first-class feature, not an afterthought.

**Consequences:** Locked to Supabase's auth model (Google OAuth, JWT). No multi-tenant or multi-region needs in V1, so no downsides.

---

## ADR-002 — Design tokens: warm-but-clean palette, 0.5 rem radius

**Date:** 2026-05-15
**Status:** Accepted

**Decision:** Off-white background (`#FAFAF7`), soft teal accent (`#2EA39A`), 0.5 rem base radius. All color decisions expressed as CSS custom properties in `globals.css`; shadcn semantic tokens map to those properties. No hardcoded hex values in component files.

**Rationale:** Friendly without being playful. Single source of truth for palette prevents drift. Pending brand sheet from Pelago — tokens make a full swap a one-file change.

**Consequences:** If Pelago brand colors are received before launch, only `globals.css` needs updating. Light mode only in V1; dark mode can be added by extending the `:root` block.

---
