/**
 * Pathfinding System
 * 
 * Implements A* pathfinding algorithm for vehicle routing through the network graph.
 * Includes block reservation system to prevent collisions and path caching for performance.
 */

import type { NetworkGraph } from './graph';
import { calculateDistance } from './utils';

/**
 * Represents a complete path through the network
 */
export interface Path {
  nodes: string[];
  edges: string[];
  totalCost: number;
}

/**
 * Result of pathfinding operation
 */
export interface PathfindingResult {
  success: boolean;
  path: Path | null;
  message?: string;
}

/**
 * Options for pathfinding algorithm
 */
export interface PathfindingOptions {
  /** Whether to consider edge capacity constraints */
  respectCapacity?: boolean;
  /** Custom cost function for edges (default: uses length) */
  costFunction?: (edgeId: string, graph: NetworkGraph) => number;
  /** Maximum number of nodes to explore before giving up */
  maxIterations?: number;
}

/**
 * Cached path entry
 */
interface CachedPath {
  path: Path;
  timestamp: number;
}

/**
 * Min-heap priority queue for A* open set
 */
class PriorityQueue<T> {
  private items: Array<{ value: T; priority: number }> = [];

  enqueue(value: T, priority: number): void {
    this.items.push({ value, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Path caching for frequently used routes
 */
export class PathCache {
  private cache = new Map<string, CachedPath>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  private getCacheKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  get(from: string, to: string, graph: NetworkGraph): Path | null {
    const key = this.getCacheKey(from, to);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Validate cached path still exists in graph
    const isValid = this.validatePath(cached.path, graph);
    if (!isValid) {
      this.cache.delete(key);
      return null;
    }

    return cached.path;
  }

  set(from: string, to: string, path: Path): void {
    const key = this.getCacheKey(from, to);

    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { path, timestamp: Date.now() });
  }

  invalidate(nodeId?: string): void {
    if (!nodeId) {
      this.cache.clear();
      return;
    }

    // Remove all paths that include this node
    for (const [key, cached] of this.cache.entries()) {
      if (cached.path.nodes.includes(nodeId)) {
        this.cache.delete(key);
      }
    }
  }

  private validatePath(path: Path, graph: NetworkGraph): boolean {
    // Check all nodes exist
    for (const nodeId of path.nodes) {
      if (!graph.getNode(nodeId)) return false;
    }

    // Check all edges exist
    for (const edgeId of path.edges) {
      if (!graph.getEdge(edgeId)) return false;
    }

    return true;
  }

  getSize(): number {
    return this.cache.size;
  }
}

/**
 * Calculate heuristic estimate (Euclidean distance)
 */
function heuristic(nodeA: string, nodeB: string, graph: NetworkGraph): number {
  const a = graph.getNode(nodeA);
  const b = graph.getNode(nodeB);

  if (!a || !b) return Infinity;

  return calculateDistance(a.position, b.position);
}

/**
 * Default cost function: edge length
 */
function defaultCostFunction(edgeId: string, graph: NetworkGraph): number {
  const edge = graph.getEdge(edgeId);
  return edge ? edge.length : Infinity;
}

/**
 * Check if edge is available (not at capacity)
 */
function isEdgeAvailable(edgeId: string, graph: NetworkGraph): boolean {
  const edge = graph.getEdge(edgeId);
  if (!edge) return false;

  return edge.occupied.length < edge.capacity;
}

/**
 * Reconstruct path from cameFrom map
 */
function reconstructPath(
  cameFrom: Map<string, { nodeId: string; edgeId: string }>,
  current: string,
  startNode: string,
  gScore: Map<string, number>
): Path {
  const nodes: string[] = [current];
  const edges: string[] = [];

  let currentNode = current;
  while (currentNode !== startNode) {
    const prev = cameFrom.get(currentNode);
    if (!prev) break;

    nodes.unshift(prev.nodeId);
    edges.unshift(prev.edgeId);
    currentNode = prev.nodeId;
  }

  return {
    nodes,
    edges,
    totalCost: gScore.get(current) ?? 0,
  };
}

/**
 * Find path using A* algorithm
 */
export function findPath(
  graph: NetworkGraph,
  startNode: string,
  endNode: string,
  options: PathfindingOptions = {}
): PathfindingResult {
  const {
    respectCapacity = true,
    costFunction = defaultCostFunction,
    maxIterations = 10000,
  } = options;

  // Validate nodes exist
  if (!graph.getNode(startNode)) {
    return { success: false, path: null, message: 'Start node not found' };
  }
  if (!graph.getNode(endNode)) {
    return { success: false, path: null, message: 'End node not found' };
  }

  // Early exit if start == end
  if (startNode === endNode) {
    return {
      success: true,
      path: { nodes: [startNode], edges: [], totalCost: 0 },
    };
  }

  const openSet = new PriorityQueue<string>();
  const closedSet = new Set<string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, { nodeId: string; edgeId: string }>();

  // Initialize
  gScore.set(startNode, 0);
  fScore.set(startNode, heuristic(startNode, endNode, graph));
  openSet.enqueue(startNode, fScore.get(startNode)!);

  let iterations = 0;

  while (!openSet.isEmpty() && iterations < maxIterations) {
    iterations++;

    const current = openSet.dequeue();
    if (!current) break;

    // Goal reached
    if (current === endNode) {
      const path = reconstructPath(cameFrom, current, startNode, gScore);
      return { success: true, path };
    }

    closedSet.add(current);

    // Explore neighbors
    const neighbors = graph.getNeighborsWithEdges(current);
    for (const { nodeId, edgeId } of neighbors) {
      if (closedSet.has(nodeId)) continue;

      // Check capacity constraint
      if (respectCapacity && !isEdgeAvailable(edgeId, graph)) {
        continue;
      }

      const edgeCost = costFunction(edgeId, graph);
      const tentativeGScore = (gScore.get(current) ?? 0) + edgeCost;

      const existingGScore = gScore.get(nodeId) ?? Infinity;
      if (tentativeGScore < existingGScore) {
        // This path is better
        cameFrom.set(nodeId, { nodeId: current, edgeId });
        gScore.set(nodeId, tentativeGScore);
        const f = tentativeGScore + heuristic(nodeId, endNode, graph);
        fScore.set(nodeId, f);
        openSet.enqueue(nodeId, f);
      }
    }
  }

  return {
    success: false,
    path: null,
    message: iterations >= maxIterations ? 'Max iterations reached' : 'No path found',
  };
}

/**
 * Reserve path for a vehicle (mark edges as occupied)
 */
export function reservePath(
  graph: NetworkGraph,
  path: Path,
  vehicleId: string
): boolean {
  // Check if all edges are available
  for (const edgeId of path.edges) {
    const edge = graph.getEdge(edgeId);
    if (!edge) return false;

    if (edge.occupied.length >= edge.capacity) {
      return false; // Cannot reserve, at capacity
    }
  }

  // Reserve all edges atomically
  for (const edgeId of path.edges) {
    const edge = graph.getEdge(edgeId);
    if (edge && !edge.occupied.includes(vehicleId)) {
      edge.occupied.push(vehicleId);
    }
  }

  return true;
}

/**
 * Release path reservation for a vehicle
 */
export function releasePath(
  graph: NetworkGraph,
  path: Path,
  vehicleId: string
): void {
  for (const edgeId of path.edges) {
    const edge = graph.getEdge(edgeId);
    if (edge) {
      edge.occupied = edge.occupied.filter((id) => id !== vehicleId);
    }
  }
}

/**
 * Find alternate path if primary path becomes blocked
 */
export function findAlternatePath(
  graph: NetworkGraph,
  currentNode: string,
  targetNode: string,
  blockedEdges: string[],
  options: PathfindingOptions = {}
): PathfindingResult {
  // Custom cost function that treats blocked edges as infinite cost
  const costFunction = (edgeId: string, g: NetworkGraph): number => {
    if (blockedEdges.includes(edgeId)) {
      return Infinity;
    }
    return options.costFunction?.(edgeId, g) ?? defaultCostFunction(edgeId, g);
  };

  return findPath(graph, currentNode, targetNode, {
    ...options,
    costFunction,
  });
}
