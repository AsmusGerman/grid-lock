# GridLock

GridLock is a 2-player, turn-based abstract strategy game played on a grid of hubs (nodes) connected by directed vectors (arrows).

This README describes the **implemented rules** in this project.

## Quick Start

```bash
npm install
npm run dev
```

Default configuration in this build:
- Board size: 7 x 7 (new matches can use 5 x 5, 7 x 7, or 9 x 9)
- Players: P1 and P2
- Match length: size-scaled (5 x 5 = 24, 7 x 7 = 40, 9 x 9 = 60)

## Objective

Create directed connections to shape hub topology and maximize your score.

At game end, the player with the higher score wins.

## Turn Flow

Each turn is one player acting:
1. Play exactly one legal move (one connection).
2. Press **Ready** to end your turn.
3. You may press **Undo Last** before Ready to remove your move and try again.

Important:
- Only one move is allowed per turn.
- You cannot play after the game reaches max turns.
- If the incoming player has no legal move, the game ends immediately.

## Opening Constraint And Circuit Connectivity

- Each player has only their **first move** as a free placement to start.
- After that opening move, every new vector by that player must be connected to the existing circuit.
- After that opening move, the **source node must be owned by the current player**.
- A move is considered connected when at least one endpoint already belongs to a structural node.

## How To Make A Move

In the UI:
1. Click a source node.
2. Click a destination node.
3. The game infers the connection type from geometry and validates it.

Nodes display their **current point value** (local contribution):
- Structural node points = `|inDegree - outDegree|`
- Balanced or trapped nodes show `0`
- Empty nodes show no number

### Connection Types

- **Normal**: orthogonally adjacent (up/down/left/right by 1).
- **Diagonal**: diagonally adjacent (1 by 1 diagonal).
- **Bridge**: orthogonal distance exactly 2 to trap an opponent node in the middle (that node becomes marked X and unplayable).

## Move Validation Rules

A move is rejected if any of these fail:
- Source/destination are out of bounds.
- Source and destination are the same node.
- Source node is trapped (marked X) or balanced (cannot output until receiving new input).
- Destination node is trapped (marked X).
- After opening, the move does not connect to the existing circuit.
- Duplicate connection already exists from source to destination.
- Opposite-direction connection already exists between those two nodes.

Additional restrictions by type:
- **Normal** must be orthogonally adjacent.
- **Diagonal** must be diagonal-adjacent, and both endpoints must already be structural (non-empty) nodes.
- **Diagonal** cannot cross another existing diagonal in the same cell.
- **Bridge** must connect two nodes owned by the current player at distance 2 (orthogonal only), trapping exactly one opponent-owned node in the middle.

### END Node Restriction

If the source is an `END` node:
- It can only connect to an adjacent node.
- It cannot connect to an empty node.

## Hub Types (Auto Classification)

Each node is reclassified after every move by in/out degree:
- **Source** (SRC): 0 in / >=1 out
- **Dead-end** (END): >=1 in / 0 out
- **Relay** (RLY): 1 in / 1 out
- **Fork** (FRK): 1 in / >=2 out
- **Join** (JON): >=2 in / 1 out
- **Reactor** (RCT): >=2 in / >=2 out

**Empty** means 0 in / 0 out.

Nodes in the game display as simple colored circles (no text labels). The type is automatically determined by the node's current connectivity.

## Ownership

- A node becomes owned when it first changes from `Empty` to a structural type.
- Ownership is permanent once acquired.
- Empty nodes are unowned.

## Balanced Nodes

When a node reaches a state where inDegree == outDegree (and inDegree > 0):
- It is marked as **balanced** (internally tracked).
- It **cannot create outbound vectors** until it receives a new input.
- Once a new input arrives, it becomes unbalanced and can output again.
- Balanced nodes contribute 0 to the player's score.
- Balanced nodes are visually indistinguishable from unbalanced nodes (no label).

## Trapped Nodes (`X`)

Nodes become trapped (marked `X`) when:
- An opponent plays a **Bridge** to trap it: the bridge connects two opponent nodes exactly 2 cells apart (orthogonal), placing the current node in the middle.

Trapped means:
- The node **cannot be used as a source** for any new move.
- The node **cannot receive new inputs**.
- Trapped nodes contribute 0 to the player's score.
- Trapped nodes are permanently removed from play.

## Scoring

Current total score is recomputed after each move and turn transition.

For each player:
- Consider owned, non-trapped, non-balanced structural nodes.
- For each such node, add `|inDegree - outDegree|`.
- Player score is the sum across those nodes.

Formula:

```text
Score(player) = sum over owned, non-trapped, non-balanced nodes of |in - out|
```

Notes:
- Empty nodes do not score.
- Trapped (`X`) nodes do not score.
- Balanced nodes do not score (since |in - out| = 0 by definition).
- A cycle bonus system exists as a stub in code, but currently awards 0.

## Win Condition

The game ends when either:
- Total turns reach the configured maximum (default 40), or
- The next player to act has no legal move.

Then:
- Higher score wins.
- Equal scores -> draw.
- A player may also surrender; surrender is an immediate loss.

## Tech

- TypeScript + Vite
- SolidJS for page UI (controls, turn info, hints)
- PixiJS for gameplay board rendering

## GitHub Pages

This repository includes a GitHub Actions workflow that builds and deploys the static site to GitHub Pages on every push to `master`.

After enabling Pages in repository settings (`Build and deployment` -> `Source: GitHub Actions`), the game is published at:

- `https://asmusgerman.github.io/grid-lock/`
