# GridLock v3 Balance Baseline

This report records an automated baseline, not a substitute for human playtesting.

## Reproduce

```bash
npm run simulate
```

The command runs 1,000 matches with seed `20261016`. Games alternate between random legal-action agents and simple forward-pressure heuristic agents. The simulation imports the same headless `GameSession` used by the UI.

## Results

| Metric | Result |
|---|---:|
| Matches | 1,000 |
| Mean successful actions | 18.828 |
| P1 wins | 580 (58.0%) |
| P2 wins | 295 (29.5%) |
| Draws | 125 (12.5%) |
| Core-Breach endings | 265 (26.5%) |
| Turn-limit endings | 728 (72.8%) |
| No-action endings | 7 (0.7%) |
| Bridge actions | 3,899 |
| Expansion actions (including Bridge claims) | 13,432 |
| Destructive attacks (including Bridge locks) | 1,150 |
| Nodes disconnected | 702 |
| Decisive endings by action 10 | 0 |

## Interpretation

The specified rules are playable and Core victory is reachable; the sample contains no evidence of systematic early forced wins. Permanent locks and capacity limits caused few outright no-action endings in these agents. However, this baseline misses the design targets in three places:

- P1's 58% win rate is above the 45–55% target.
- Turn-limit decisions are the majority, not the minority.
- Core Breaches are not the majority of decisive endings.

The agents are intentionally weak and the sample mixes agent policies, so these figures should guide tests rather than be treated as a balance verdict. Bridge usage is high; human review should look for automatic Bridge openings and whether permanent midpoint locks dominate ordinary expansion.

## Proposed experiments (not implemented)

Test one change at a time against the unchanged baseline:

1. Give P2 the first action in alternating tournament games to separate first-player advantage from policy bias.
2. Test an 11-action allowance per player to measure whether one additional approach action converts limit endings into Breaches.
3. Test counting the first Core Breach as an outgoing-capacity-free attack, while retaining the current capacity rule for all other actions.

These are proposals only. The shipped engine continues to implement the specified 20-action limit and capacity rule exactly.
