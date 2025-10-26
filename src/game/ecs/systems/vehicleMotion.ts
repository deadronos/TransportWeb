import type { Path, PathfindingResult } from "@/game/network/pathfinding";
import type { NetworkGraph } from "@/game/network/graph";
import type { Entity } from "../world";
import { findAlternatePath, reservePath } from "@/game/network/pathfinding";

const EPSILON = 1e-4;

/**
 * Calculate the distance required to decelerate from current speed to target speed.
 * Uses kinematic equation: d = (v_final^2 - v_initial^2) / (2 * deceleration)
 */
export function calculateBrakingDistance(
  currentSpeed: number,
  targetSpeed: number,
  deceleration: number,
): number {
  if (deceleration <= 0 || currentSpeed <= targetSpeed) {
    return 0;
  }
  return (currentSpeed * currentSpeed - targetSpeed * targetSpeed) / (2 * deceleration);
}

/**
 * Calculate the target speed for a vehicle given remaining distance to destination.
 * This ensures smooth deceleration by determining if braking should begin.
 */
export function calculateTargetSpeed(
  currentSpeed: number,
  remainingDistance: number,
  maxSpeed: number,
  acceleration: number,
  deceleration: number,
): number {
  // If we need to brake to reach zero speed at destination
  const brakingDistance = calculateBrakingDistance(currentSpeed, 0, deceleration);
  
  if (remainingDistance <= brakingDistance) {
    // Start braking: calculate speed we should have at this distance
    // Using: v^2 = 2 * a * d (solving for v when decelerating to 0)
    const targetSpeed = Math.sqrt(2 * deceleration * remainingDistance);
    return Math.max(0, Math.min(targetSpeed, currentSpeed));
  }
  
  // Not yet time to brake, can accelerate toward max speed
  return maxSpeed;
}

/**
 * Apply acceleration or deceleration to vehicle speed based on target speed.
 * Mutates vehicle speed and returns the new speed.
 */
export function updateVehicleSpeed(
  vehicle: NonNullable<Entity["Vehicle"]>,
  targetSpeed: number,
  dt: number,
): number {
  const currentSpeed = vehicle.speed;
  
  if (targetSpeed > currentSpeed) {
    // Accelerate toward target
    vehicle.speed = Math.min(targetSpeed, currentSpeed + vehicle.accel * dt);
  } else if (targetSpeed < currentSpeed) {
    // Decelerate toward target (use acceleration value as deceleration rate)
    vehicle.speed = Math.max(targetSpeed, currentSpeed - vehicle.accel * dt);
  }
  // else: already at target speed, no change
  
  return vehicle.speed;
}

/**
 * Apply acceleration to vehicle speed (mutates vehicle) and return new speed.
 * @deprecated Use updateVehicleSpeed with calculateTargetSpeed for smoother motion
 */
export function accelerateVehicle(
  vehicle: NonNullable<Entity["Vehicle"]>,
  dt: number,
): number {
  vehicle.speed = Math.min(
    vehicle.maxSpeed,
    vehicle.speed + vehicle.accel * dt,
  );
  return vehicle.speed;
}

/**
 * Calculate the effective speed limit for an edge, considering both the
 * edge's speed limit and the vehicle's maximum speed.
 */
export function getEffectiveSpeedLimit(
  edgeSpeedLimit: number,
  vehicleMaxSpeed: number,
): number {
  return Math.min(edgeSpeedLimit, vehicleMaxSpeed);
}

/**
 * Release reservations for the remaining (future) edges of a path starting
 * from `startIndex`. This leaves any previously-traversed edges reserved.
 */
export function releaseFutureReservations(
  graph: NetworkGraph,
  path: Path,
  startIndex: number,
  vehicleId: string,
) {
  for (let i = startIndex; i < path.edges.length; i += 1) {
    const edgeId = path.edges[i];
    if (!edgeId) continue;
    const edge = graph.getEdge(edgeId);
    if (!edge) continue;
    edge.occupied = edge.occupied.filter((id) => id !== vehicleId);
  }
}

/**
 * Attempt to reroute the vehicle from its current node to its target using
 * `findAlternatePath`. If a new path is found and successfully reserved,
 * the vehicle's route is updated and the old future reservations are released.
 * Returns `true` when reroute succeeds, otherwise `false`.
 */
export function attemptReroute(
  graph: NetworkGraph,
  route: NonNullable<Entity["Vehicle"]>["route"],
  vehicleId: string,
  pathCache?: {
    get: (a: string, b: string, g: NetworkGraph) => Path | null;
    set: (a: string, b: string, p: Path) => void;
  },
): boolean {
  if (!route?.currentNodeId || !route?.targetNodeId) return false;

  // Build blocked edges list: edges that are at-capacity *and* are not already
  // reserved by this vehicle (these should be avoided in any alternate path).
  const blockedEdges: string[] = [];
  for (const edge of graph.getAllEdges()) {
    const full = edge.occupied.length >= edge.capacity;
    // Mark edge as blocked if full and not occupied by this vehicle. This
    // allows a vehicle that reserved the edge earlier to keep using it.
    if (full && !edge.occupied.includes(vehicleId)) {
      blockedEdges.push(edge.id);
    }
  }

  // If we have a cached alternate path, prefer it (and validate via the
  // pathfinding result below); otherwise call findAlternatePath.
  const start = route.currentNodeId;
  const target = route.targetNodeId;

  const result: PathfindingResult = findAlternatePath(
    graph,
    start,
    target,
    blockedEdges,
    { respectCapacity: true },
  );

  if (!result.success || !result.path || result.path.edges.length === 0) {
    return false;
  }

  // Try to reserve the new path. If reservation fails, abort reroute.
  const reserved = reservePath(graph, result.path, vehicleId);
  if (!reserved) {
    return false;
  }

  // Release only the future reservations of the old path (if any). Determine
  // the first edge index to release: if `distanceAlongEdge` is > EPSILON the
  // vehicle is mid-edge and should hold the current edge reservation until
  // it completes; otherwise the currentEdgeIndex can be released.
  if (route.path) {
    const startReleaseIndex =
      route.currentEdgeIndex + (route.distanceAlongEdge > EPSILON ? 1 : 0);
    releaseFutureReservations(graph, route.path, startReleaseIndex, vehicleId);
  }

  // Update route to use new path and reset traversal indices so the caller
  // will start following the new path from the `currentNodeId`.
  route.path = result.path;
  route.currentEdgeIndex = 0;
  route.distanceAlongEdge = 0;

  // Update cache if provided
  if (pathCache) {
    pathCache.set(start, target, result.path);
  }

  return true;
}

export default {
  accelerateVehicle,
  updateVehicleSpeed,
  calculateTargetSpeed,
  calculateBrakingDistance,
  getEffectiveSpeedLimit,
  releaseFutureReservations,
  attemptReroute,
};
