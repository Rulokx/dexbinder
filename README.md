# DexBinder — Pokémon TCG Collection Tracker

A personal, **English-language** Pokémon TCG collection tracker. Milestone 1 ports the
one-file HTML prototype to **React + TypeScript + Vite** while keeping the exact same
dark binder design, the 120 Pitch Black cards / 194 tracked variants, and full
compatibility with existing JSON backups and browser saves. It installs on an iPhone
as a Home Screen app and opens without a connection.

## Use it on your iPhone

Live app: <https://rulokx.github.io/dexbinder/> (published from `main` by GitHub Actions).

1. Open that address in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open **DexBinder** from the new Home Screen icon. It runs full screen, like an app.
4. Inside the installed app, tap **Import Backup** and pick your `DexBinder_PitchBlack_Backup.json`
   (from Files, iCloud Drive, or AirDrop) to bring your collection over.

Good to know:

- The installed app and Safari keep **separate** collections on iPhone. Import inside the installed app.
- Each device keeps its own collection. Move it with **Export Backup** / **Import Backup**; there is no automatic sync yet.
- In the installed app, **Export Backup** and **↓ Export CSV** open the share sheet, so you can **Save to Files** or AirDrop the file.
- The app opens offline and your marks still work. Card images need internet because they load from Scrydex.

## Publish with GitHub Pages

The workflow in `.github/workflows/deploy.yml` installs dependencies, runs every test,
builds, and publishes `dist/` on each push to `main`. A push with a failing test is not deployed.

One-time setup in the GitHub repository: **Settings** → **Pages** → **Build and deployment** →
**Source**: **GitHub Actions**. The repository has to be **Public** on a free GitHub plan.
Only the app's code is public; collections stay on each person's device.

## Run it on Windows

1. Install **Node.js 22 LTS** from <https://nodejs.org> (choose the LTS installer; keep the defaults).
2. Open **PowerShell** or **Windows Terminal** in this folder
   (in File Explorer: right-click inside the folder → **Open in Terminal**).
3. Install dependencies (first time only):
   ```powershell
   npm install
   ```
4. Start the app:
   ```powershell
   npm run dev
   ```
   Open <http://localhost:5173> in Chrome or Edge. Press `Ctrl+C` in the terminal to stop.

### Other commands

| Command                 | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| `npm test`              | Runs the automated test suite once (Vitest + Testing Library).      |
| `npm run test:watch`    | Re-runs tests as you edit files.                                    |
| `npm run typecheck`     | TypeScript strict check without building.                           |
| `npm run build`         | Typecheck + production build into `dist/`.                          |
| `npm run preview`       | Serves `dist/` locally at <http://localhost:4173> to check the build.|
| `npm run legacy:check`  | Runs the original prototype's smoke test against `legacy/index.html`.|

### Moving your collection into the new app

Browser storage is tied to the page's **origin**. The old `index.html` opened from
`file:///…` and the new app at `http://localhost:5173` are different origins, so the
new app starts empty. To carry your marks over:

1. Open the old `legacy/index.html` → **Export Backup** (downloads `DexBinder_PitchBlack_Backup.json`).
2. Open the new app → **Import Backup** → pick that file → confirm.

The backup format did not change, so this works in both directions.

## What's implemented (Milestone 1)

- Binder view (9 cards/page) and List view (24 cards/page), responsive layout, print styles.
- Remote card thumbnails with zoom preview, graceful fallback when an image fails to load.
- Variant checkboxes — only the finishes that exist on each card (Regular, Holo, Reverse Holo, Special).
- All / Base / Secret Rares tabs, search, rarity and status filters, pagination.
- Live master-set progress: percent, owned/missing variants, completed cards.
- Browser-local persistence, "session only" indicator when storage is blocked.
- JSON backup export/import (version 2, legacy-compatible), English CSV checklist, Clear Collection.
- Installable app: web manifest, Home Screen icon, iPhone status bar and notch spacing,
  offline app shell through a service worker (card images are not cached by the app).
- 50 automated tests covering counts, filtering, checkbox clicks, persistence, JSON round-trip,
  legacy backup import, invalid-file handling, CSV output, English UI strings, iPhone
  share-sheet export, and the service-worker build.

## Project layout

```
dexbinder/
├─ index.html                 Vite entry (mounts #root)
├─ src/
│  ├─ main.tsx                React bootstrap
│  ├─ App.tsx                 Picks the active set, remounts CollectionView per set
│  ├─ domain/                 Pure, framework-free logic (fully unit-tested)
│  │  ├─ types.ts             Card, CardSet, OwnedMap, filters, stats, BackupV2
│  │  ├─ variants.ts          Legacy variant keys ↔ English display labels
│  │  ├─ collection.ts        Ownership keys, stats, filtering, sanitising
│  │  └─ backup.ts            JSON backup create/parse, CSV builder
│  ├─ data/sets/              One folder per expansion
│  │  ├─ pitch-black.json     120-card snapshot (unchanged from the prototype)
│  │  ├─ pitch-black.ts       CardSet metadata: id, storage keys, links, file names
│  │  └─ index.ts             Set registry (`SETS`, `getSet`)
│  ├─ storage/localStorage.ts Defensive persistence adapter
│  ├─ hooks/                  useCollection, usePreferences, useToast
│  ├─ components/             TopBar, Hero, StatStrip, Controls, CardGallery, CardTile,
│  │                          Pagination, Footer, ImageDialog, Toast, CollectionView
│  ├─ pwa/                    Service-worker registration (production only)
│  ├─ utils/download.ts       Download on desktop, share sheet in the installed iPhone app
│  ├─ styles/app.css          The prototype's CSS, same class names
│  └─ test/setup.ts           jsdom polyfills + Testing Library setup
├─ public/                    Copied as-is: manifest.webmanifest, icons/
├─ build/                     Build-time tooling
│  ├─ pwa.ts                  Vite plugin that writes dist/sw.js with the hashed file list
│  └─ service-worker.js       Service-worker template (offline app shell)
├─ .github/workflows/deploy.yml  Test, build and publish to GitHub Pages
├─ legacy/                    The original one-file prototype, still runnable
│  ├─ index.html
│  ├─ pitch-black-cards.json
│  └─ tests/check_app.cjs
├─ CLAUDE.md                  Project context + invariants for Claude / Claude Code
└─ HANDOFF_PROMPT.md          Kick-off prompt for the next milestone
```

### Architecture in one paragraph

Everything that *knows* about cards lives in `src/domain/` as pure functions with no
React or browser dependencies, so it is trivially testable and reusable from a future
mobile shell, a service worker or a sync layer. A `CardSet` object (`src/data/sets/*.ts`)
declares a set's id, card list, where secret rares start, which localStorage keys it
uses, export file names and attribution links — the UI reads all of that from the set,
never from constants. `App` selects the active set from the registry and mounts
`CollectionView` with `key={set.id}`, so every piece of per-set state resets cleanly
when switching expansions. Hooks (`useCollection`, `usePreferences`) are the only place
that touches storage; components are presentational and receive callbacks.

## Backward-compatible data format (do not change casually)

- Ownership key in localStorage: `pokemon-pitch-black-master-194-visual-v1`
- Preferences key: `pokemon-pitch-black-preferences-v2`
- Ownership map keys are `` `${num}|${variant}` `` where `variant` is one of the **legacy
  internal strings** `Normal`, `Holo`, `Reverse Holo`, `Especial`.
  Only the *display labels* are English: `Normal → Regular`, `Especial → Special`.
- Backup JSON: `{ "set": "me5", "version": 2, "owned": { "1|Normal": 1, … }, "exported": "<ISO>" }`
- Import validates the set id, rejects non-object `owned` maps, drops unknown keys and
  asks for confirmation before replacing the saved collection.

If canonical English variant ids are ever wanted, write an explicit migration with tests
and keep importing version-2 files.

## Data and licensing caveats

- The card list is the prototype's snapshot. Names, rarities and finishes have **not** been
  independently verified against an authoritative set record. Verify before relying on it
  for anything beyond personal tracking.
- Card images are hot-linked from `images.scrydex.com`. The app does not bundle or cache
  artwork and makes no claims about those images. Scrydex's terms (checked Oct 2026) do not
  address displaying their images on other sites, and they prohibit redistributing, mirroring
  or commercially using their services without written authorization. Personal,
  non-commercial use carries some risk, and Scrydex could block hot-linking at any time.
  Moving to an image source with explicit terms is part of the next milestone.
  Pokémon card artwork belongs to its rights holders.
- The published page includes `noindex` so search engines don't list it.

## Next milestone

See `HANDOFF_PROMPT.md`. In short: a second expansion through the set registry, set
switching UI, per-set progress, and a version-3 multi-set backup that still imports v2 files.
