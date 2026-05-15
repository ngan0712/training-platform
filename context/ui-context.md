# UI Context

## Theme

Light only. No dark mode in V1. The design language is **warm-but-clean** — an off-white page background, white surfaces for cards, dark ink for text, a single soft teal accent for interactive elements, and muted status colors. Friendly without being playful; serious enough for a compulsory company program.

## Colors

All components must use these tokens via Tailwind theme extensions or `var(--token)`. No hardcoded hex values in component files.

| Role            | CSS Variable       | Value     |
| --------------- | ------------------ | --------- |
| Page background | `--bg-base`        | `#FAFAF7` |
| Surface         | `--bg-surface`     | `#FFFFFF` |
| Surface raised  | `--bg-raised`      | `#F4F2EC` |
| Primary text    | `--text-primary`   | `#1A1A1A` |
| Muted text      | `--text-muted`     | `#6B6B6B` |
| Primary accent  | `--accent-primary` | `#2EA39A` |
| Accent hover    | `--accent-hover`   | `#258A82` |
| Border          | `--border-default` | `#E7E5DF` |
| Border strong   | `--border-strong`  | `#CFCDC6` |
| Error           | `--state-error`    | `#C24A4A` |
| Warning         | `--state-warning`  | `#C98A2C` |
| Success         | `--state-success`  | `#3F8F5A` |
| Locked / muted  | `--state-locked`   | `#B3B1AA` |

## Typography

| Role      | Font                | Variable      |
| --------- | ------------------- | ------------- |
| UI text   | Inter               | `--font-sans` |
| Code/mono | JetBrains Mono      | `--font-mono` |

Type scale (px / Tailwind class):

| Use                | Size      | Class       |
| ------------------ | --------- | ----------- |
| Caption            | 12 / 16   | `text-xs`   |
| Body small         | 14 / 20   | `text-sm`   |
| Body               | 16 / 24   | `text-base` |
| Subhead            | 20 / 28   | `text-xl`   |
| Section title      | 28 / 36   | `text-3xl`  |
| Page title         | 36 / 44   | `text-4xl`  |

Weights: 400 body, 500 emphasized, 600 headings. No 700 / black.

## Border Radius

| Context           | Class          |
| ----------------- | -------------- |
| Inline / small UI | `rounded-md`   |
| Buttons, inputs   | `rounded-lg`   |
| Cards / panels    | `rounded-xl`   |
| Modals / overlays | `rounded-2xl`  |
| Pills / badges    | `rounded-full` |

## Spacing

Tailwind's default 4px scale. Page content max-width is `max-w-[1100px]`. Section gap is `space-y-8`. Card inner padding is `p-6`. Form fields stack with `space-y-4`.

## Component Library

shadcn/ui on top of Tailwind. Components live in `components/ui/`. Use the shadcn CLI to add new components rather than writing from scratch.

Confirmed components for V1 (19 total), grouped by purpose:

| Group | Components |
|---|---|
| Layout / chrome | `button`, `card`, `separator`, `avatar`, `dropdown-menu`, `skeleton`, `sonner`, `tooltip` |
| Status & progress | `badge`, `progress` |
| Forms | `form`, `input`, `textarea`, `select`, `radio-group`, `switch`, `checkbox`, `dialog` |
| Admin views | `table` |

Install in one command:

```bash
npx shadcn@latest add button card separator avatar dropdown-menu skeleton sonner tooltip badge progress form input textarea select radio-group switch checkbox dialog table
```

Deliberately excluded from V1 (add only if a concrete need appears): `tabs`, `sheet`, `popover`, `command`, `scroll-area`, `accordion`, `alert`, `alert-dialog`, `calendar`, `date-picker`, `navigation-menu`.

## Layout Patterns

- **Shell:** fixed sidebar on the left (~220px), main content on the right. Sidebar has a bottom border separator on small viewports.
- **Sidebar:** logo at top, learner nav (Dashboard, Modules, My Group), admin nav (Cohort, Modules, Users, Groups) visible only to admins, profile + sign-out at bottom.
- **Page header:** title + optional breadcrumb at top of content area, generous `mb-8` below.
- **Dashboard:** two-column grid on desktop — progress ring + 8-week timeline strip on the left, "Continue" card + group card on the right. Stacks on mobile.
- **Module page:** single column. Header (title, week, description), then a vertical list of `MaterialRow` items.
- **MaterialRow:** type icon, title, Compulsory/Optional badge, status indicator (idle / completed). Whole row is clickable; opens external URL in a new tab and fires the click-tracking endpoint.
- **Locked state:** module cards and modules in the timeline use `--state-locked` text and a lock icon, with a tooltip explaining what to finish to unlock.
- **Modals:** centered overlay with backdrop blur, `rounded-2xl`, max-width `max-w-lg` for forms.
- **Navbar:** no top navbar — all navigation is in the sidebar.
- **Tables (admin):** sticky header, zebra rows via `even:bg-[--bg-raised]`, status cells render as compact badges.

## Icons

Lucide React. Stroke-based icons only, default stroke width. Sizes:

- `h-4 w-4` for inline (next to text in tables, breadcrumbs).
- `h-5 w-5` for buttons and nav items.
- `h-6 w-6` for empty-state hero icons.

Material type → icon mapping:

| Material type | Icon         |
| ------------- | ------------ |
| `doc`         | `FileText`   |
| `slides`      | `Presentation` |
| `reading`     | `BookOpen`   |
| `video`       | `Play`       |
| `form`        | `ClipboardList` |
