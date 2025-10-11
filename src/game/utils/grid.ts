import { Vector3 } from "three";

/**
 * Snap a position to the grid
 */
export function snapToGrid(position: Vector3, gridSize = 10): Vector3 {
  return new Vector3(
    Math.round(position.x / gridSize) * gridSize,
    Math.round(position.y / gridSize) * gridSize,
    Math.round(position.z / gridSize) * gridSize,
  );
}

/**
 * Snap only X and Z to grid, preserve Y (for terrain following)
 */
export function snapToGridXZ(position: Vector3, gridSize = 10): Vector3 {
  return new Vector3(
    Math.round(position.x / gridSize) * gridSize,
    position.y,
    Math.round(position.z / gridSize) * gridSize,
  );
}

/**
 * Get grid coordinates from world position
 */
export function worldToGrid(
  position: Vector3,
  gridSize = 10,
): { x: number; y: number; z: number } {
  return {
    x: Math.round(position.x / gridSize),
    y: Math.round(position.y / gridSize),
    z: Math.round(position.z / gridSize),
  };
}

/**
 * Get world position from grid coordinates
 */
export function gridToWorld(
  gridX: number,
  gridY: number,
  gridZ: number,
  gridSize = 10,
): Vector3 {
  return new Vector3(gridX * gridSize, gridY * gridSize, gridZ * gridSize);
}
