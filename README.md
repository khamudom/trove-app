# Trove

**Store → Label → Scan → Find**

Trove is a mobile-first, installable Progressive Web App for digitally organizing physical storage and finding belongings.

## Problem

You know you own it — but where did you put it? Trove creates a searchable digital representation of what's inside your bins, boxes, and containers.

## Core loop

1. **Store** — Create bins and record what's inside.
2. **Label** — Generate printable QR labels for physical containers.
3. **Scan** — Scan a label to instantly see contents.
4. **Find** — Search or ask by voice: “Where did I put the hammer?”

## Stack

- React + TypeScript + Vite
- React Router
- Supabase (optional account-backed persistence)
- CSS Modules + design tokens
- PWA via `vite-plugin-pwa`
- Browser Speech Recognition (no LLM)

## Architecture

```
UI → feature hooks → repository layer → in-memory guest store | Supabase
Public QR scans → /b/:qrToken → Supabase RPC (read-only, no auth)
```

### Guest mode

Signed-out users can build **one bin** with items in an in-memory session store. Closing the app clears that data — nothing is written to Supabase or durable browser storage. Creating a second bin prompts sign-up. No anonymous Supabase auth user is created automatically.

### Account-backed QR labels

Creating printable QR labels requires sign-up/sign-in. QR codes encode `{origin}/b/:qrToken` — never internal bin IDs. Public scan routes are read-only and do not expose edit/delete actions.

### Repository migrator

`exportLocalSnapshot` / `importSnapshotForUser` allow one-shot migration of local bins into a Supabase account after signup.

## Local development

```bash
npm install
npm run dev
```

The app compiles and runs without Supabase credentials.

## Environment variables

Copy `.env.example` to `.env.local`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase setup

1. Create a Supabase project.
2. Run the migration in `supabase/migrations/001_initial_schema.sql`.
3. Enable email/password auth.
4. Add env vars and restart the dev server.

The migration creates:

- `bins` and `items` tables with owner RLS
- Unique CSPRNG `qr_token` per bin
- `get_public_bin_by_qr_token` RPC for unauthenticated read-only access

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview production build |

## Voice commands

Deterministic parser — no LLM:

- “Add hammer to the toolbox”
- “Where did I put the hammer?”
- “What is in Camping Gear?”
- “Show me the toolbox”

## PWA

Installable with manifest, service worker, and app-shell caching. Static assets are cached; user data is not indiscriminately cached offline.

## Testing

```bash
npm run test
npm run build
```

## Limitations (MVP)

- Guest sessions are limited to one in-memory bin; data is discarded when the app closes
- No anonymous Supabase users
- No cross-device sync without account sign-in
- Public QR lookup requires Supabase (local-only bins have no public token)
- In-app QR scanning uses the device camera via `getUserMedia` (native `BarcodeDetector` when available, jsQR fallback for Safari/iOS); if camera permission is denied, scan the QR label with the phone camera app instead
- Account recovery and identity providers deferred
- Bidirectional sync / conflict resolution deferred

## Deployment

Deploy the Vite build to any static host. Set environment variables at build time. Ensure `/b/:qrToken` and SPA routes fall back to `index.html`.
