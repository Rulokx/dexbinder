# CLAUDE.md — DexBinder project context

## Product goal

DexBinder is a **personal Pokémon TCG collecting companion**. The user collects
**English-print Pokémon cards** and prefers a visual, click-to-check catalog over Excel.
The UI must be **English (en-US)**; conversations with the user may be in Spanish.

Long-term ideas (do not attempt all at once): multiple expansions, mobile + desktop
sync, camera card scanning, condition / holo detection, duplicates, wishlist, optional
price lookups.

## Current implementation (Milestone 1 — done)

Vite 8 + React 19 + TypeScript 5 (strict). Vitest 5 + Testing Library + jsdom for tests.
No backend, no paid services, no runtime dependencies beyond React.

```
src/domain/      pure logic: types, variants, collection (keys/stats/filters), backup (JSON/CSV)
src/data/sets/   one folder per expansion + registry (SETS, getSet, DEFAULT_SET_ID)
src/storage/     localStorage adapter (defensive; never throws)
src/hooks/       useCollection, usePreferences, useToast
src/components/  presentational components + CollectionView (wires everything for one set)
src/styles/      app.css — the prototype's CSS, identical class names
src/pwa/         service-worker registration (production builds only)
src/utils/       download.ts — normal download on desktop, share sheet in the installed iPhone app
public/          manifest.webmanifest + icons/ (copied as-is)
build/           pwa.ts (Vite plugin that emits dist/sw.js) + service-worker.js template
.github/         deploy.yml — test, build and publish to GitHub Pages on push to main
legacy/          the original one-file prototype + its smoke test (still runnable)
```

Installable app: `display: standalone`, iOS meta tags (`black` status bar), safe-area
padding, `noindex`. The service worker precaches only the app shell (hashed build files,
manifest, icons), uses network-first for page loads with a 4 s fallback to the cached
shell, and never intercepts cross-origin requests — card images are not cached by the app.
`tsconfig.node.json` typechecks `vite.config.ts` and `build/`; `npm run typecheck` runs both.

`App` picks the active `CardSet` from the registry and renders
`<CollectionView key={set.id} …/>`; the `key` remounts per-set state on switch.
The set switcher in `Hero` only renders when `SETS.length > 1`.

### Data model

`Card = { num, number, name, rarity, variants, image, large }` — `num` is 1-based,
`number` is the printed `001/084` form. `CardSet` adds `id` (`me5`), `name`, `code`,
`baseCount` (84; `num > baseCount` ⇒ secret rare), `storage` keys, export `files`, and
attribution `links`.

`variants` holds the **legacy internal strings** `Normal`, `Holo`, `Reverse Holo`,
`Especial`. English labels come from `VARIANT_LABELS` (`Normal → Regular`,
`Especial → Special`). **Do not rename the internal strings.** Ownership keys are
`${num}|${variant}`; saves and backups depend on them.

Pitch Black storage keys (legacy, keep): `pokemon-pitch-black-master-194-visual-v1`
(owned) and `pokemon-pitch-black-preferences-v2` (view/section). New sets should use
`dexbinder:<id>:owned:v1` / `dexbinder:<id>:prefs:v1`.

Backup v2: `{ set, version: 2, owned, exported }`. `parseBackup` rejects other sets /
malformed files, sanitises keys against the catalog, and reports ignored keys.

## Invariants (enforced by tests — keep them green)

- 120 catalog cards and 194 variants for Pitch Black unless independently validated data says otherwise.
- Every checkbox is a real finish for that card; never invent missing finish types.
- Checkbox changes update progress and filters and survive reload when storage is available.
- Legacy backups import without losing ownership; unknown or malicious keys are dropped;
  the user is asked before saved data is replaced.
- English UI end-to-end: visible text, aria-labels, dialog, alerts, toasts, CSV headers and Yes/No values.
  (The CSS hover overlay used to say "Ver grande"; it is now "View large". Tests assert no Spanish strings.)
- Remote images may fail; the tile falls back to an English alt text and dims the image.
- The app must still work in "session only" mode when localStorage throws.

Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run legacy:check` before handing work back.

## Roadmap

1. ~~Foundation: Vite + React + TS, modules, tests, Windows instructions.~~ **Done.**
2. **Multiple English expansions**: second set via the registry; set switcher; per-set
   progress; backup v3 `{ version: 3, sets: { me5: {...}, <id>: {...} } }` that still imports v2;
   a reliable English-only data source (document provenance per set).
3. **Collection features**: duplicate quantities, finer variant granularity only when verified
   (stamps/promos), wishlist, condition, sorting; versioned migrations with tests.
4. **Installable PWA**: ~~manifest, icons, offline app shell, GitHub Pages workflow~~ **done**.
   Remaining: image source with explicit terms (Scrydex terms don't cover third-party display),
   image caching only if those terms allow it.
5. **Optional sync**: sign-in + database, conflict resolution, authenticated API. Not before 2–4.
6. **Camera scanning**: recognition pipeline with human confirmation; licensing review first.

## Working agreements

- Keep the UI English; code comments and docs in English.
- Do not rebuild the visual design from scratch; extend `app.css` and the existing components.
- Small, tested changes. Run the test suite and explain remaining limitations.
- Treat `src/data/sets/pitch-black.json` as a starting snapshot, not authoritative set data.
- Ask for explicit approval before adding paid APIs, hosting charges or invasive permissions.
- Keep `legacy/index.html` runnable as the behavioral reference until Milestone 2 ships.
