# Copy this prompt into Claude Code — Milestone 2

I'm continuing **DexBinder**, my personal English-language Pokémon TCG collection tracker.
Milestone 1 is done: the one-file prototype is now a React + TypeScript + Vite project with
40 passing tests. Read `CLAUDE.md` and `README.md` first, then `src/domain/`, `src/data/sets/`
and `src/components/CollectionView.tsx`.

Before changing anything, run `npm install`, `npm test`, `npm run build` and confirm they pass.

**Milestone 2 — multiple English expansions, no backend:**

1. Add a second Pokémon TCG expansion through the set registry in `src/data/sets/`. I'll tell you
   which set and provide or approve the data source. Do not invent card lists, rarities or finishes;
   if a reliable English-only source isn't available, stop and ask. Record the source and date in
   the set's `.ts` file.
2. New sets must use storage keys `dexbinder:<id>:owned:v1` / `dexbinder:<id>:prefs:v1`.
   Pitch Black keeps its legacy keys unchanged.
3. The set switcher in `Hero` already renders when more than one set is registered. Make switching
   feel right: remember the last opened set, show per-set progress, keep filters per set.
4. Introduce backup **version 3** that contains every set:
   `{ "version": 3, "exported": "<ISO>", "sets": { "me5": { "owned": {...} }, "<id>": { "owned": {...} } } }`.
   Importing a version-2 file (single set, legacy keys) must keep working and only touch that set.
   Export CSV stays per set. Add tests for v2→v3 import, v3 round-trip and wrong-set rejection.
5. Add a small "All expansions" overview (cards owned / total per set) only if it fits the existing
   design without a redesign.
6. Keep the UI English, keep all existing tests green, add tests for every new behavior, and
   update `README.md` / `CLAUDE.md`.

Do not add cloud sync, accounts, camera scanning, paid APIs or image caching in this milestone.
Finish with a runnable local project, the test output, and a short list of what Milestone 3 should cover.
