import { Vector3 } from "three";
import type { NetworkNode } from "./types";

/**
 * Calculate Euclidean distance between two positions.
 */
export function calculateDistance(
  posA: [number, number, number],
  posB: [number, number, number],
): number {
  const dx = posB[0] - posA[0];
  const dy = posB[1] - posA[1];
  const dz = posB[2] - posA[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate Manhattan distance between two positions (grid-aligned).
 */
export function calculateManhattanDistance(
  posA: [number, number, number],
  posB: [number, number, number],
): number {
  return (
    Math.abs(posB[0] - posA[0]) +
    Math.abs(posB[1] - posA[1]) +
    Math.abs(posB[2] - posA[2])
  );
}

/**
 * Find the closest node to a given position.
 * @param nodes Array of nodes to search
 * @param position Target position
 * @param maxDistance Maximum search distance (optional)
 * @returns Closest node or null if none found within maxDistance
 */
export function findClosestNode(
  nodes: NetworkNode[],
  position: [number, number, number],
  maxDistance?: number,
): NetworkNode | null {
  let closest: NetworkNode | null = null;
  let minDistance = maxDistance ?? Infinity;

  for (const node of nodes) {
    const distance = calculateDistance(node.position, position);
    if (distance < minDistance) {
      minDistance = distance;
      closest = node;
    }
  }

  return closest;
}

/**
 * Check if two positions are approximately equal (within tolerance).
 */
export function positionsEqual(
  posA: [number, number, number],
  posB: [number, number, number],
  tolerance = 0.1,
): boolean {
  return calculateDistance(posA, posB) < tolerance;
}

/**
 * Convert position array to Three.js Vector3.
 */
export function positionToVector3(position: [number, number, number]): Vector3 {
  return new Vector3(position[0], position[1], position[2]);
}

/**
 * Convert Three.js Vector3 to position array.
 */
export function vector3ToPosition(vector: Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}

/**
 * Generate a unique ID for network elements.
 * @param prefix Prefix for the ID (e.g., 'node', 'edge')
 */
export function generateNetworkId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Snap position to nearest node if within snap distance.
 * @param position Position to snap
 * @param nodes Available nodes
 * @param snapDistance Maximum distance to snap
 * @returns Snapped position or original if no node nearby
 */
export function snapToNearestNode(
  position: [number, number, number],
  nodes: NetworkNode[],
  snapDistance = 5,
): [number, number, number] {
  const closest = findClosestNode(nodes, position, snapDistance);
  return closest ? closest.position : position;
}

/**
 * Calculate the direction vector between two positions.
 */
export function getDirection(
  from: [number, number, number],
  to: [number, number, number],
): Vector3 {
  const direction = new Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2],
  );
  return direction.normalize();
}

/**
 * Interpolate between two positions.
 * @param from Start position
 * @param to End position
 * @param t Interpolation factor (0 to 1)
 */
export function lerpPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}
