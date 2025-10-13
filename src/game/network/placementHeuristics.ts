import { calculateDistance } from "./utils";
import type { NetworkNode } from "./types";

export interface NeighborAnchor {
  nodeId: string;
  position: [number, number, number];
  direction: [number, number, number] | null;
}

export interface NeighborSelectionOptions {
  previousPlacement: NeighborAnchor | null;
  directionHint: [number, number, number] | null;
  fanOut: boolean;
  maxConnections?: number;
}

type Vec2 = [number, number];

const EPSILON = 1e-4;

function to2D(
  from: [number, number, number],
  to: [number, number, number],
): Vec2 {
  return [to[0] - from[0], to[2] - from[2]];
}

function length2D([x, y]: Vec2): number {
  return Math.hypot(x, y);
}

function normalize2D(vector: Vec2): Vec2 | null {
  const length = length2D(vector);
  if (length < EPSILON) {
    return null;
  }
  return [vector[0] / length, vector[1] / length];
}

function dot2D(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

function bestCandidate(
  candidates: NetworkNode[],
  scorer: (node: NetworkNode) => number,
): NetworkNode | null {
  let best: NetworkNode | null = null;
  let bestScore = -Infinity;

  for (const node of candidates) {
    const score = scorer(node);
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }

  return best;
}

/**
 * Choose which neighboring nodes should connect to a newly placed junction.
 * Prefers continuing straight lines and avoids unintentionally fanning out
 * unless the caller explicitly requests it via `fanOut`.
 */
export function chooseNeighborsForConnection(
  nodePosition: [number, number, number],
  neighbors: NetworkNode[],
  options: NeighborSelectionOptions,
): NetworkNode[] {
  if (neighbors.length === 0) {
    return [];
  }

  if (options.fanOut) {
    return neighbors.slice();
  }

  const maxConnections = options.maxConnections ?? 2;
  if (neighbors.length <= maxConnections) {
    return neighbors.slice();
  }

  const selected: NetworkNode[] = [];
  const available = [...neighbors];

  const take = (node: NetworkNode) => {
    selected.push(node);
    const index = available.findIndex((candidate) => candidate.id === node.id);
    if (index >= 0) {
      available.splice(index, 1);
    }
  };

  const previous = options.previousPlacement;
  if (previous) {
    const match = available.find(
      (candidate) => candidate.id === previous.nodeId,
    );
    if (match) {
      take(match);
    }
  }

  const orientationSource: Vec2 | null = options.directionHint
    ? [options.directionHint[0], options.directionHint[2]]
    : previous?.direction
    ? [previous.direction[0], previous.direction[2]]
    : null;

  const orientationHint =
    orientationSource !== null ? normalize2D(orientationSource) : null;

  if (orientationHint && selected.length < maxConnections && available.length) {
    const oriented = bestCandidate(available, (candidate) => {
      const direction = normalize2D(to2D(nodePosition, candidate.position));
      if (!direction) {
        return -Infinity;
      }
      return dot2D(direction, orientationHint);
    });
    if (oriented) {
      take(oriented);
    }
  }

  if (!selected.length && available.length) {
    available.sort(
      (a, b) =>
        calculateDistance(a.position, nodePosition) -
        calculateDistance(b.position, nodePosition),
    );
    const [first] = available;
    if (first) {
      take(first);
    }
  }

  if (!available.length || selected.length >= maxConnections) {
    return selected;
  }

  const first = selected[0] ?? null;
  const firstDirection = first ? normalize2D(to2D(nodePosition, first.position)) : null;
  if (firstDirection && available.length) {
    const straight = bestCandidate(available, (candidate) => {
      const direction = normalize2D(to2D(nodePosition, candidate.position));
      if (!direction) {
        return -Infinity;
      }
      const alignment = dot2D(direction, firstDirection);
      return -Math.abs(alignment + 1); // closeness to straight line
    });

    if (straight) {
      take(straight);
    }
  }

  if (selected.length >= maxConnections || !available.length) {
    return selected;
  }

  available.sort(
    (a, b) =>
      calculateDistance(a.position, nodePosition) -
      calculateDistance(b.position, nodePosition),
  );
  const [fallback] = available;
  if (fallback) {
    take(fallback);
  }

  return selected;
}
