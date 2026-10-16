# GridLock v3 — Siege Network Rules

## Objective

Build a powered directed network, disrupt the opposing network, and Breach the enemy Core twice from two different adjacent coordinates.

## Setup

- Use the 5 × 5 board, with zero-based engine coordinates.
- P1 Core: `(0, 2)` (A3).
- P2 Core: `(4, 2)` (E3).
- All other nodes begin Empty.
- Each player has two Bridge charges and at most ten actions.
- P1 acts first. There is no placement or confirmation phase.

## Nodes and power

- **Empty:** unowned and claimable.
- **Active:** owned and reachable from its owner's Core through directed, same-owner arrows. It can act.
- **Dormant:** still owned, but not reachable from its Core. It cannot act, but can be attacked or powered again.
- **Locked:** permanently disabled, unowned, and marked X. It cannot receive or emit arrows.
- **Core:** permanently owned and powered. It cannot be locked or crossed by a Bridge.

Power follows arrow direction only. Branches, merges, alternative paths, and cycles are legal. Crossed arrows do not interact. Locking a node removes every incident arrow, after which both networks are recomputed.

## A turn

Each turn contains exactly one successful action. Select an Active owned node (or your Core), then a destination. A valid action applies atomically and automatically passes play. Invalid input changes nothing and spends nothing.

Normal nodes have two outgoing slots; Cores have three. A full source cannot Expand, Reinforce, Attack, Bridge, or Breach. Incoming arrows are unrestricted.

### Expand

Connect to an orthogonally adjacent Empty node. You claim and power it, and create an arrow from source to destination.

### Reinforce

Connect to an orthogonally adjacent node you already own. This adds another directed route and can restore Dormant nodes. Duplicate arrows are forbidden, but opposite-direction arrows and directed cycles are legal.

### Attack

Target an orthogonally adjacent enemy normal node. It becomes Locked, loses its owner, and all arrows touching it are removed. Attacks never capture nodes.

### Bridge

Explicitly activate Bridge mode, then connect an Active source to an Empty node exactly two spaces away horizontally or vertically.

- The destination is claimed and linked with a distinct Bridge arrow.
- An enemy normal node in the middle becomes Locked.
- An Empty, friendly, or already Locked middle node is unchanged.
- A Bridge cannot pass through or damage a Core.
- One charge and the turn are spent only when the action succeeds.

### Breach

An Active enemy node orthogonally adjacent to a Core can attack it. The first Breach permanently records that attacking coordinate. The second Breach must originate from a different adjacent coordinate and wins immediately. Breaches do not create arrows.

## Ending the game

The game ends immediately when:

1. A player lands a second valid Core Breach.
2. The incoming player has no legal action of any kind, including Bridge or Breach; the previous player wins.
3. A player surrenders.
4. Twenty successful actions have been played.

At the action limit, compare in order:

1. Breaches inflicted on the opposing Core.
2. Active normal nodes in enemy territory (P1: columns 3–4; P2: columns 0–1).
3. Active normal nodes anywhere.
4. Draw.

Core nodes never count in node tiebreaks. An immediate second Breach takes priority over the action limit.

## Local undo

Undo restores the complete state before the most recent action, including arrows, ownership, power, Bridge charges, Breaches, action counters, winner, and current player. It is optional and never adds a confirmation step.
