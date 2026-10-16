import { Board } from '../board/Board';
import { NodeState } from '../types';
import { GAME_RULES, opponent } from './GameRules';
import type { ActionType, GridCoord, MoveDescriptor, PlayerID, ValidationResult } from '../types';

export interface ValidationContext {
  bridgeCharges: Record<PlayerID, number>;
  breachOrigins: Record<PlayerID, GridCoord[]>;
}

export class ConnectionValidator {
  validate(board: Board, move: MoveDescriptor, context: ValidationContext): ValidationResult {
    if (!board.inBounds(move.from) || !board.inBounds(move.to)) return this.fail('Node is out of bounds.');
    if (Board.sameCoord(move.from, move.to)) return this.fail('Choose a different destination.');
    const source = board.getNode(move.from);
    const target = board.getNode(move.to);
    if (source.ownedBy !== move.player || (source.state !== NodeState.Active && source.state !== NodeState.Core)) {
      return this.fail('Only your powered nodes can act.');
    }
    const capacity = source.isCore ? GAME_RULES.coreOutgoingCapacity : GAME_RULES.normalOutgoingCapacity;
    if (source.outDegree >= capacity) return this.fail('This node has no outgoing capacity left.');

    if (move.action === 'Bridge') return this.validateBridge(board, move, context);
    if (!Board.isOrthogonal(move.from, move.to)) return this.fail('Normal actions target an orthogonally adjacent node.');
    if (target.state === NodeState.Locked) return this.fail('Locked nodes cannot be targeted.');

    let action: ActionType;
    if (target.state === NodeState.Empty) action = 'Expand';
    else if (target.ownedBy === move.player) action = 'Reinforce';
    else if (target.isCore && target.ownedBy === opponent(move.player)) action = 'Breach';
    else if (target.ownedBy === opponent(move.player)) action = 'Attack';
    else return this.fail('That node cannot be targeted.');

    if ((action === 'Expand' || action === 'Reinforce') && board.hasConnection(move.from, move.to)) {
      return this.fail('That directed connection already exists.');
    }
    if (action === 'Breach') {
      const origins = context.breachOrigins[opponent(move.player)];
      if (origins.some(origin => Board.sameCoord(origin, move.from))) {
        return this.fail('A second Breach must come from a different adjacent coordinate.');
      }
    }
    return { valid: true, action };
  }

  legalMoves(board: Board, player: PlayerID, context: ValidationContext): MoveDescriptor[] {
    const moves: MoveDescriptor[] = [];
    for (const source of board.allNodes()) {
      if (source.ownedBy !== player || (source.state !== NodeState.Active && source.state !== NodeState.Core)) continue;
      for (const target of board.allNodes()) {
        const normal: MoveDescriptor = { from: source.coord, to: target.coord, player };
        if (this.validate(board, normal, context).valid) moves.push(normal);
        const bridge: MoveDescriptor = { ...normal, action: 'Bridge' };
        if (this.validate(board, bridge, context).valid) moves.push(bridge);
      }
    }
    return moves;
  }

  private validateBridge(board: Board, move: MoveDescriptor, context: ValidationContext): ValidationResult {
    if (context.bridgeCharges[move.player] <= 0) return this.fail('No Bridge charges remain.');
    if (!Board.isBridgeRange(move.from, move.to)) return this.fail('A Bridge travels exactly two spaces horizontally or vertically.');
    const target = board.getNode(move.to);
    if (target.state !== NodeState.Empty) return this.fail('A Bridge destination must be empty.');
    const middle = board.getNode(Board.middle(move.from, move.to));
    if (middle.isCore) return this.fail('A Bridge cannot pass through a Core.');
    if (board.hasConnection(move.from, move.to)) return this.fail('That directed connection already exists.');
    return { valid: true, action: 'Bridge' };
  }

  private fail(reason: string): ValidationResult { return { valid: false, reason }; }
}

export { ConnectionValidator as MoveValidator };
