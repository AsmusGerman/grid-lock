import { Board } from '../board/Board';
import { ConnectionType, NodeType } from '../types';
import { nodeTypeScore } from './HubClassifier';
import type { GamePhase, GridCoord, INode, MoveDescriptor, ValidationResult } from '../types';

/**
 * Stateless validator that checks all GridLock move rules.
 * Each method returns a ValidationResult so callers can surface messages.
 */
export class ConnectionValidator {
  /**
   * Full validation pipeline. Returns the first failing rule or a valid result.
   * @param playerPhase  Phase of the player making the move (Foundation | Expansion).
   */
  validate(
    board: Board,
    move: MoveDescriptor,
    playerPhase: GamePhase,
    requireSourceOwnership = true,
  ): ValidationResult {
    const checks = [
      () => this.checkInBounds(board, move),
      () => this.checkNotSameNode(move),
      () => this.checkPhaseRequirements(board, move, playerPhase),
      () => this.checkSourceOwnership(board, move, requireSourceOwnership),
      () => this.checkSourceNotBlocked(board, move),
      () => this.checkDestinationPlayable(board, move),
      () => this.checkSourceVectorRestriction(board, move),
      () => this.checkConnectionRange(move),
      () => this.checkNoReverseExists(board, move),
      () => this.checkNoDuplicate(board, move),
      () => this.checkDiagonalRestriction(board, move),
      () => this.checkBridgeRestriction(board, move),
      () => this.checkDiagonalBridgeRestriction(board, move),
      () => this.checkConquestStrength(board, move),
      () => this.checkNoCrossing(board, move),
    ];

    for (const check of checks) {
      const result = check();
      if (!result.valid) return result;
    }

    return { valid: true };
  }

  // ─── Individual rule checks ──────────────────────────────────────────────────

  private checkInBounds(board: Board, move: MoveDescriptor): ValidationResult {
    if (!board.inBounds(move.from) || !board.inBounds(move.to)) {
      return { valid: false, reason: 'Node is out of bounds.' };
    }
    return { valid: true };
  }

  private checkNotSameNode(move: MoveDescriptor): ValidationResult {
    if (move.from.col === move.to.col && move.from.row === move.to.row) {
      return { valid: false, reason: 'Source and destination must differ.' };
    }
    return { valid: true };
  }

  /** Diagonal, Bridge, and DiagonalBridge require Expansion phase — unless the source node is a Source hub. */
  private checkPhaseRequirements(board: Board, move: MoveDescriptor, playerPhase: GamePhase): ValidationResult {
    if (
      (move.connectionType === ConnectionType.Diagonal ||
        move.connectionType === ConnectionType.Bridge ||
        move.connectionType === ConnectionType.DiagonalBridge) &&
      playerPhase !== 'Expansion'
    ) {
      // Source hubs can play straight Bridges (orthogonal distance 2) in Foundation.
      if (
        move.connectionType === ConnectionType.Bridge &&
        board.getNode(move.from).type === NodeType.Source
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `${move.connectionType} connections are only available in the Expansion phase (requires ≥4 owned nodes).`,
      };
    }
    return { valid: true };
  }

  private checkSourceNotBlocked(board: Board, move: MoveDescriptor): ValidationResult {
    const source = board.getNode(move.from);
    if (source.isPassthrough) {
      return {
        valid: false,
        reason: 'This node is blocked by a vector passing over it.',
      };
    }
    if (source.isTrapped) {
      return {
        valid: false,
        reason: 'This node is trapped (X) and cannot be played anymore.',
      };
    }
    if (source.isOutBlocked) {
      return {
        valid: false,
        reason: 'This source node is blocked (X). Choose another source node.',
      };
    }
    if (source.isBalanced) {
      return {
        valid: false,
        reason: 'Balanced nodes cannot create outbound vectors until they receive a new input.',
      };
    }
    if (source.type === NodeType.Relay) {
      return {
        valid: false,
        reason: 'Relay (0-point) nodes cannot create outbound vectors; they must receive a new input first.',
      };
    }
    return { valid: true };
  }

  private checkSourceOwnership(
    board: Board,
    move: MoveDescriptor,
    requireSourceOwnership: boolean,
  ): ValidationResult {
    if (!requireSourceOwnership) {
      return { valid: true };
    }
    const source = board.getNode(move.from);
    if (source.ownedBy !== move.player) {
      return {
        valid: false,
        reason: 'You can only play from nodes you own.',
      };
    }
    return { valid: true };
  }

  private checkDestinationPlayable(board: Board, move: MoveDescriptor): ValidationResult {
    const destination = board.getNode(move.to);
    if (destination.isPassthrough) {
      return {
        valid: false,
        reason: 'Destination node is blocked by a vector passing over it.',
      };
    }
    if (destination.isTrapped) {
      return {
        valid: false,
        reason: 'Destination node is trapped (X) and cannot receive new vectors.',
      };
    }
    return { valid: true };
  }

  /** Source hubs can only create straight (orthogonal) vectors: Normal or Bridge. */
  private checkSourceVectorRestriction(board: Board, move: MoveDescriptor): ValidationResult {
    const source = board.getNode(move.from);
    if (source.type === NodeType.Source) {
      if (
        move.connectionType === ConnectionType.Diagonal ||
        move.connectionType === ConnectionType.DiagonalBridge
      ) {
        return {
          valid: false,
          reason: 'Source hubs can only create straight (orthogonal) vectors.',
        };
      }
    }
    return { valid: true };
  }

  private checkConnectionRange(move: MoveDescriptor): ValidationResult {
    const { from, to, connectionType } = move;

    if (connectionType === ConnectionType.Normal) {
      if (!Board.isOrthogonal(from, to)) {
        return { valid: false, reason: 'Normal connections must be orthogonally adjacent.' };
      }
    }

    if (connectionType === ConnectionType.Diagonal) {
      if (!Board.isDiagonal(from, to)) {
        return { valid: false, reason: 'Diagonal connections must connect diagonally adjacent nodes.' };
      }
    }

    if (connectionType === ConnectionType.Bridge) {
      if (!Board.isBridgeRange(from, to)) {
        return { valid: false, reason: 'Straight bridge must span exactly 2 cells along an orthogonal line.' };
      }
    }

    if (connectionType === ConnectionType.DiagonalBridge) {
      if (!Board.isDiagonalBridge(from, to)) {
        return { valid: false, reason: 'Diagonal bridge must span exactly 2 cells diagonally.' };
      }
    }

    return { valid: true };
  }

  private checkNoReverseExists(board: Board, move: MoveDescriptor): ValidationResult {
    if (board.hasReverseConnection(move.from, move.to)) {
      if (this.canReverseWithStraightBridge(board, move)) {
        return { valid: true };
      }
      return { valid: false, reason: 'An opposite-direction connection already exists between these nodes.' };
    }
    return { valid: true };
  }

  private canReverseWithStraightBridge(board: Board, move: MoveDescriptor): boolean {
    if (move.connectionType !== ConnectionType.Bridge) return false;
    const fromNode = board.getNode(move.from);
    const toNode = board.getNode(move.to);
    return fromNode.ownedBy === move.player && toNode.ownedBy === move.player;
  }

  private checkNoDuplicate(board: Board, move: MoveDescriptor): ValidationResult {
    if (board.hasConnection(move.from, move.to)) {
      return { valid: false, reason: 'A connection already exists between these nodes.' };
    }
    return { valid: true };
  }

  /** Diagonal (distance 1): both endpoints must be owned nodes. */
  private checkDiagonalRestriction(board: Board, move: MoveDescriptor): ValidationResult {
    if (move.connectionType !== ConnectionType.Diagonal) return { valid: true };

    const fromNode = board.getNode(move.from);
    const toNode = board.getNode(move.to);

    if (fromNode.ownedBy === null || toNode.ownedBy === null) {
      return {
        valid: false,
        reason: 'Diagonal connections can only be placed between owned nodes (not empty).',
      };
    }

    return { valid: true };
  }

  /** Straight bridge: orthogonal distance 2.
   *  From Source hub: middle node just becomes passthrough (can be empty).
   *  From non-Source hub: traps opponent middle node (both endpoints must be owned).
   */
  private checkBridgeRestriction(board: Board, move: MoveDescriptor): ValidationResult {
    if (move.connectionType !== ConnectionType.Bridge) return { valid: true };

    const fromNode = board.getNode(move.from);

    // Source-hub bridge: a straight reach of length 2.
    // Middle node must not already be trapped or passthrough.
    if (fromNode.type === NodeType.Source) {
      const middleCoord = ConnectionValidator.bridgeMiddle(move.from, move.to);
      if (!middleCoord) {
        return { valid: false, reason: 'Bridge could not resolve middle node.' };
      }
      const middleNode = board.getNode(middleCoord);
      if (middleNode.isTrapped || middleNode.isPassthrough) {
        return { valid: false, reason: 'Bridge middle node is already blocked.' };
      }
      return { valid: true };
    }

    // Non-Source bridge: trapping bridge, both endpoints must be owned.
    const toNode = board.getNode(move.to);
    if (fromNode.ownedBy !== move.player || toNode.ownedBy !== move.player) {
      return {
        valid: false,
        reason: 'Bridge endpoints must be nodes owned by the current player.',
      };
    }

    const trappedCoord = ConnectionValidator.bridgeMiddle(move.from, move.to);
    if (!trappedCoord) {
      return { valid: false, reason: 'Bridge could not resolve middle node.' };
    }

    return this.validateBridgeMiddle(board, trappedCoord, move.player);
  }

  /** Diagonal bridge: diagonal distance 2 (checkers jump); traps opponent middle node. */
  private checkDiagonalBridgeRestriction(board: Board, move: MoveDescriptor): ValidationResult {
    if (move.connectionType !== ConnectionType.DiagonalBridge) return { valid: true };

    // Source must be owned by the current player; destination can be empty.
    const fromNode = board.getNode(move.from);
    if (fromNode.ownedBy !== move.player) {
      return {
        valid: false,
        reason: 'Diagonal bridge source must be a node owned by the current player.',
      };
    }

    const trappedCoord = ConnectionValidator.bridgeMiddle(move.from, move.to);
    if (!trappedCoord) {
      return { valid: false, reason: 'Diagonal bridge could not resolve middle node.' };
    }

    return this.validateBridgeMiddle(board, trappedCoord, move.player);
  }

  /** Shared validation for the middle node of any bridge type. */
  private validateBridgeMiddle(
    board: Board,
    trappedCoord: GridCoord,
    player: string,
  ): ValidationResult {
    const trappedNode = board.getNode(trappedCoord);
    if (trappedNode.type === NodeType.Empty || trappedNode.ownedBy === null) {
      return { valid: false, reason: 'Bridge middle node must be an owned node.' };
    }
    if (trappedNode.ownedBy === player) {
      return { valid: false, reason: 'Bridge middle node must belong to the opponent.' };
    }
    if (trappedNode.isTrapped) {
      return { valid: false, reason: 'Bridge middle node is already trapped.' };
    }
    return { valid: true };
  }

  // ─── General crossing check ──────────────────────────────────────────────────

  /** When connecting to a node owned by the opponent, source must have strictly more points. */
  private checkConquestStrength(board: Board, move: MoveDescriptor): ValidationResult {
    const dest = board.getNode(move.to);
    if (dest.ownedBy === null || dest.ownedBy === move.player) return { valid: true };

    const src = board.getNode(move.from);
    const srcPts = this.nodePoints(src);
    const destPts = this.nodePoints(dest);

    if (srcPts <= destPts) {
      return {
        valid: false,
        reason: `Your node (${srcPts} pts) must have more points than the opponent's node (${destPts} pts) to connect to it.`,
      };
    }
    return { valid: true };
  }

  private nodePoints(node: INode): number {
    if (node.isTrapped || node.isBalanced || node.type === NodeType.Relay) return 0;
    return nodeTypeScore(node.type) + node.diagonalBonus;
  }

  /**
   * Prevents any connection from visually crossing another connection.
   * Uses a proper segment-intersection test.
   */
  private checkNoCrossing(board: Board, move: MoveDescriptor): ValidationResult {
    for (const existing of board.getConnections()) {
      if (ConnectionValidator.segmentsCross(move.from, move.to, existing.from, existing.to)) {
        return {
          valid: false,
          reason: `This connection would cross an existing ${existing.type} connection.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Returns true if segments AB and CD properly cross (share an interior point
   * but NOT just an endpoint). Uses cross-product orientation test.
   */
  private static segmentsCross(a: GridCoord, b: GridCoord, c: GridCoord, d: GridCoord): boolean {
    const cross = (o: GridCoord, p: GridCoord, q: GridCoord): number =>
      (p.col - o.col) * (q.row - o.row) - (p.row - o.row) * (q.col - o.col);

    const d1 = cross(c, d, a);
    const d2 = cross(c, d, b);
    const d3 = cross(a, b, c);
    const d4 = cross(a, b, d);

    // Strict inequality excludes collinear/shared-endpoint cases.
    return (d1 * d2 < 0) && (d3 * d4 < 0);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Returns the middle coordinate of a bridge (works for both straight and diagonal). */
  static bridgeMiddle(from: GridCoord, to: GridCoord): GridCoord | null {
    const dc = to.col - from.col;
    const dr = to.row - from.row;
    const absDc = Math.abs(dc);
    const absDr = Math.abs(dr);

    const isStraight = (absDc === 2 && absDr === 0) || (absDc === 0 && absDr === 2);
    const isDiag = absDc === 2 && absDr === 2;

    if (!isStraight && !isDiag) return null;

    return {
      col: from.col + Math.sign(dc),
      row: from.row + Math.sign(dr),
    };
  }
}
