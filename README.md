# GridLock v3 — Siege Network

GridLock is a deterministic two-player strategy game about building, protecting, and disrupting directed networks. Power flows outward from each player's Core. Breach the opposing Core twice, from two different positions, to win.

## Play

```bash
npm install
npm run dev
```

The competitive rules use one 5 × 5 board. P1's Core begins at A3 and P2's at E3. P1 acts first; there is no setup phase.

On a turn, select one of your powered nodes and then a highlighted destination. The action executes immediately and play passes to the opponent:

- Empty adjacent node: **Expand** and claim it.
- Own adjacent node: **Reinforce** with another directed route.
- Enemy adjacent normal node: **Attack** and permanently lock it.
- Enemy adjacent Core: **Breach** it.
- **Bridge** mode: spend one of two charges to jump two orthogonal spaces to an empty node, locking an enemy normal node in the middle.

Normal nodes can emit two arrows; Cores can emit three. Incoming arrows are unlimited. Dormant nodes remain owned but cannot act until a directed route from their Core is restored.

See [RULES.md](RULES.md) for the complete rules and [BALANCE.md](BALANCE.md) for the reproducible simulation baseline.

## Development

```bash
npm test
npm run build
npm run simulate
```

- `npm test` runs headless engine tests.
- `npm run build` type-checks and creates the production bundle.
- `npm run simulate` runs 1,000 seeded matches using random and simple heuristic agents.

The rules engine under `src/nexus` has no SolidJS or PixiJS dependency. SolidJS owns the HUD and overlays; PixiJS renders the board and interaction feedback.

## Technology

- TypeScript and Vite
- SolidJS
- PixiJS
- Vitest
