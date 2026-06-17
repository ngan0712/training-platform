# 12 — Logout

## Goal

Give users a reliable, feedback-rich sign-out path from the sidebar profile menu, with proper session scope, loading state, and error handling.

## Current state

A skeleton exists but has several gaps:

| File                                    | Status                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `app/sign-out/route.ts`                 | Exists — POST handler calls `signOut()` (global scope) and redirects to `/sign-in`                          |
| `components/shared/ProfileMenu.tsx`     | Exists — `postSignOut()` dynamically creates a `<form>` and submits it; no loading state, no error handling |
| `components/shared/sign-out-button.tsx` | Exists but **imported nowhere** — dead code                                                                 |

## Gaps this unit closes

1. **No loading state** — user gets zero feedback while the POST is in-flight; button is not disabled, enabling double-submit.
2. **No error handling** — if the server returns 5xx, the user sees nothing and stays stuck.
3. **Wrong sign-out scope** — default `signOut()` revokes all sessions on all devices (global). Correct behaviour for a "sign out of this browser" button is `scope: 'local'`.
4. **Dead code** — `sign-out-button.tsx` is orphaned; the two approaches should converge on the `ProfileMenu` implementation.

## Acceptance criteria

- Clicking "Sign out" immediately disables the dropdown item and shows a spinner.
- On success the browser navigates to `/sign-in` and the Supabase session cookie is cleared.
- On server error (5xx / network failure) a Sonner toast shows "Sign out failed — please try again" and the button re-enables.
- Double-click is impossible: button stays disabled until redirect or error.
- `app/sign-out/route.ts` calls `signOut({ scope: 'local' })`.
- `components/shared/sign-out-button.tsx` is deleted.

## In scope

- `app/sign-out/route.ts` — add `{ scope: 'local' }`.
- `components/shared/ProfileMenu.tsx` — replace `postSignOut()` with `useTransition` + `fetch` + `useRouter`; add spinner/disabled state; add error toast.
- Delete `components/shared/sign-out-button.tsx`.

## Out of scope

- "Are you sure?" confirmation dialog.
- Global session revocation (other devices stay signed in — acceptable for V1).
- Inactivity-based auto sign-out.

## Implementation notes

- Use `useTransition` for the pending state: `isPending` disables the item and shows a Lucide `Loader2` spinner in place of `LogOut`.
- `fetch('/sign-out', { method: 'POST' })` with default `redirect: 'follow'` — on the happy path the server 302s to `/sign-in` and fetch follows it (returning a 200). Then call `router.push('/sign-in')` to trigger a proper Next.js navigation.
- Treat any response with `res.status >= 500` as an error; show the Sonner toast and return early.
- Import `useRouter` from `next/navigation`, `toast` from `sonner`, `Loader2` from `lucide-react`.

## Files changed

- `app/sign-out/route.ts` — minor edit.
- `components/shared/ProfileMenu.tsx` — replace sign-out logic.
- `components/shared/sign-out-button.tsx` — **deleted**.

## Dependencies

- U3 (Auth) — sign-out route and ProfileMenu already exist.

## Definition of Done

- Manual test: clicking "Sign out" shows spinner, lands on `/sign-in`, session is gone (refreshing `/dashboard` redirects back to `/sign-in`).
- Manual test: with DevTools throttled to slow 3G, spinner is visible during the in-flight request.
- `npm run typecheck` + `npm run build` green.
