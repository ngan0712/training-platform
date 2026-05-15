# 01 — Design System

> Status: **Complete.** Recorded retrospectively so the numbering stays continuous.

## Goal

Establish the visual foundation: design tokens, fonts, and the shadcn/ui component set so every later unit composes from the same primitives.

## What shipped

- shadcn/ui initialized (base-nova style, `@base-ui/react`) with 19 components in `components/ui/`: `button`, `card`, `separator`, `avatar`, `dropdown-menu`, `skeleton`, `sonner`, `tooltip`, `badge`, `progress`, `form`, `input`, `textarea`, `select`, `radio-group`, `switch`, `checkbox`, `dialog`, `table`.
- `lucide-react` installed for icons.
- `lib/utils.ts` exporting `cn()` helper.
- `globals.css` with full design-token `:root` block mapped to shadcn semantics (palette + radius + spacing per `ui-context.md`).
- `layout.tsx` wires Inter + JetBrains Mono via `next/font`.
- `TooltipProvider` mounted at the root layout.
- `npm run typecheck` and `npm run build` green.

## Out of scope

- Any app routes, auth, DB, or business logic (those belong to later units).

## Dependencies

- None. Foundation unit.

## Definition of Done

- All 19 components import cleanly.
- A demo page can render `<Button variant="default">Hello</Button>` and a `<Card>` using only tokens — no hardcoded hex.
