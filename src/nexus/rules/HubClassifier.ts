import { NodeType } from '../types';
import type { INode } from '../types';

/**
 * Pure function: derives the NodeType from a node's current in/out degree.
 * Only the owner's connections count towards hub type so that opponent
 * connections don't inadvertently upgrade the hub.
 * If the node is unowned, all connections are counted.
 */
export function classifyNode(node: INode): NodeType {
  const owner = node.ownedBy;
  const inn = owner
    ? node.inConnections.filter(c => c.player === owner).length
    : node.inConnections.length;
  const out = owner
    ? node.outConnections.filter(c => c.player === owner).length
    : node.outConnections.length;

  if (inn === 0 && out === 0) return NodeType.Empty;
  if (inn === 0 && out >= 1) return NodeType.Source;
  if (inn >= 1 && out === 0) return NodeType.DeadEnd;
  if (inn === 1 && out === 1) return NodeType.Relay;
  if (inn === 1 && out >= 2) return NodeType.Fork;
  if (inn >= 2 && out === 1) return NodeType.Join;
  // inn >= 2 && out >= 2
  return NodeType.Reactor;
}

/**
 * Returns the base point value for a hub type.
 * SRC=1, END=1, FRK=3, JON=3, RCT=5, everything else=0.
 * Caller is responsible for excluding trapped, balanced, and Relay nodes.
 */
export function nodeTypeScore(type: NodeType): number {
  switch (type) {
    case NodeType.Source:  return 1;
    case NodeType.DeadEnd: return 2;
    case NodeType.Fork:    return 3;
    case NodeType.Join:    return 3;
    case NodeType.Reactor: return 5;
    default: return 0; // Empty, Relay
  }
}

/** Human-readable short label shown inside/below a hub. */
export const NODE_TYPE_LABEL: Record<NodeType, string> = {
  [NodeType.Empty]: '',
  [NodeType.Source]: 'SRC',
  [NodeType.DeadEnd]: 'END',
  [NodeType.Relay]: 'RLY',
  [NodeType.Fork]: 'FRK',
  [NodeType.Join]: 'JON',
  [NodeType.Reactor]: 'RCT',
};
