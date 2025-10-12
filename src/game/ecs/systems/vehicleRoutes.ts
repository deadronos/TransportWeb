import type { World } from "miniplex";
import type { Entity } from "../world";
import { useNetworkStore } from "@/game/state/slices/network";
import {
  PathCache,
  findPath,
  reservePath,
  releasePath,
} from "@/game/network/pathfinding";
import type { Path } from "@/game/network/pathfinding";
import { findClosestNode, lerpPosition } from "@/game/network/utils";
import type { NetworkNode } from "@/game/network/types";
import { accelerateVehicle, attemptReroute } from "./vehicleMotion";

const pathCache = new PathCache(200);
const VEHICLE_HEIGHT_OFFSET = 0.5;
const ARRIVAL_DWELL_SECONDS = 1;
const RETRY_DELAY_SECONDS = 1;
const EPSILON = 1e-4;

function ensureRoute(vehicle: NonNullable<Entity["Vehicle"]>) {
  vehicle.route ??= {
    state: "idle",
    currentNodeId: null,
    targetNodeId: null,
    path: null,
    currentEdgeIndex: 0,
    distanceAlongEdge: 0,
    dwellTimeRemaining: 0,
  };

  return vehicle.route;
}

function adjustPosition([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] {
  return [x, y + VEHICLE_HEIGHT_OFFSET, z];
}

function pickDestinationNode(
  graphNodes: NetworkNode[],
  originId: string,
): NetworkNode | null {
  const candidates = graphNodes.filter((node) => node.id !== originId);
  if (candidates.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  // candidates[index] may be `undefined` by --strict checks, so normalize
  // the return value to `null` when no candidate exists to match the
  // declared return type of `NetworkNode | null`.
  return candidates[index] ?? null;
}

function removeOccupancy(
  graph: ReturnType<typeof useNetworkStore.getState>["graph"],
  edgeId: string,
  vehicleId: string,
): boolean {
  const edge = graph.getEdge(edgeId);
  if (!edge) return false;

  const previous = edge.occupied.length;
  edge.occupied = edge.occupied.filter((id) => id !== vehicleId);
  return edge.occupied.length !== previous;
}

function alignTransformToNode(
  transform: NonNullable<Entity["Transform"]>,
  node: NetworkNode,
) {
  transform.position[0] = node.position[0];
  transform.position[1] = node.position[1] + VEHICLE_HEIGHT_OFFSET;
  transform.position[2] = node.position[2];
}

function clearRoute(
  graph: ReturnType<typeof useNetworkStore.getState>["graph"],
  vehicle: NonNullable<Entity["Vehicle"]>,
  vehicleId: string,
  reason: "arrived" | "failed",
  incrementDirty: () => void,
) {
  const route = vehicle.route;
  if (!route) return;

  if (route.path) {
    releasePath(graph, route.path, vehicleId);
    incrementDirty();
  }

  vehicle.speed = 0;
  route.path = null;
  route.currentEdgeIndex = 0;
  route.distanceAlongEdge = 0;
  route.targetNodeId = null;
  route.state = reason === "arrived" ? "waiting" : "idle";
  route.dwellTimeRemaining =
    reason === "arrived" ? ARRIVAL_DWELL_SECONDS : RETRY_DELAY_SECONDS;
}

export function advanceVehicleSimulation(world: World<Entity>, dt: number) {
  const networkStore = useNetworkStore.getState();
  const { graph } = networkStore;
  const allNodes = graph.getAllNodes();

  let graphDirty = false;

  for (const entity of world.with("Vehicle", "Transform")) {
    const { Vehicle: vehicle, Transform: transform } = entity;
    const route = ensureRoute(vehicle);

    if (route.dwellTimeRemaining > 0) {
      route.dwellTimeRemaining = Math.max(route.dwellTimeRemaining - dt, 0);
    }

    if (route.state === "waiting") {
      if (route.dwellTimeRemaining <= 0) {
        route.state = "idle";
      }
      vehicle.speed = 0;
      continue;
    }

    if (route.state === "idle") {
      if (route.dwellTimeRemaining > 0) {
        continue;
      }

      if (allNodes.length < 2) {
        vehicle.speed = 0;
        continue;
      }

      const startNode = (() => {
        if (route.currentNodeId) {
          const node = graph.getNode(route.currentNodeId);
          if (node) {
            return node;
          }
        }

        return findClosestNode(allNodes, transform.position) ?? null;
      })();

      if (!startNode) {
        vehicle.speed = 0;
        continue;
      }

      const destinationNode = pickDestinationNode(allNodes, startNode.id);
      if (!destinationNode) {
        route.dwellTimeRemaining = RETRY_DELAY_SECONDS;
        vehicle.speed = 0;
        continue;
      }

      let path: Path | null = pathCache.get(
        startNode.id,
        destinationNode.id,
        graph,
      );

      if (!path) {
        const result = findPath(graph, startNode.id, destinationNode.id);
        if (!result.success || !result.path || result.path.edges.length === 0) {
          route.dwellTimeRemaining = RETRY_DELAY_SECONDS;
          vehicle.speed = 0;
          continue;
        }

        path = result.path;
        pathCache.set(startNode.id, destinationNode.id, path);
      }

      if (!reservePath(graph, path, entity.id)) {
        route.dwellTimeRemaining = RETRY_DELAY_SECONDS;
        vehicle.speed = 0;
        continue;
      }

      graphDirty = true;

      route.state = "moving";
      route.currentNodeId = startNode.id;
      route.targetNodeId = destinationNode.id;
      route.path = path;
      route.currentEdgeIndex = 0;
      route.distanceAlongEdge = 0;
      route.dwellTimeRemaining = 0;
      vehicle.speed = 0;
      alignTransformToNode(transform, startNode);
      continue;
    }

    if (route.state !== "moving" || !route.path) {
      vehicle.speed = 0;
      continue;
    }

    // Accelerate vehicle using motion helper
    accelerateVehicle(vehicle, dt);
    let distanceRemaining = vehicle.speed * dt;

    while (distanceRemaining > EPSILON) {
      if (!route.path || route.currentEdgeIndex >= route.path.edges.length) {
        clearRoute(graph, vehicle, entity.id, "arrived", () => {
          graphDirty = true;
        });
        break;
      }

      const fromNodeId = route.path.nodes[route.currentEdgeIndex];
      const toNodeId = route.path.nodes[route.currentEdgeIndex + 1];
      const edgeId = route.path.edges[route.currentEdgeIndex];

      const fromNode = fromNodeId ? graph.getNode(fromNodeId) : undefined;
      const toNode = toNodeId ? graph.getNode(toNodeId) : undefined;
      const edge = edgeId ? graph.getEdge(edgeId) : undefined;

      // If the expected edge or nodes are missing, try to reroute from the
      // current node (only when not already mid-edge). If reroute fails,
      // clear the route and mark graph dirty.
      if (!fromNode || !toNode || !edge || edge.length <= 0) {
        if (route.distanceAlongEdge <= EPSILON) {
          const rerouted = attemptReroute(graph, route, entity.id, pathCache);
          if (rerouted) {
            graphDirty = true;
            // Start processing the new path in this tick
            continue;
          }
        }

        clearRoute(graph, vehicle, entity.id, "failed", () => {
          graphDirty = true;
        });
        break;
      }

      // If next edge is now at capacity and doesn't include this vehicle's
      // reservation, attempt to reroute (only when we haven't started the
      // edge yet). If reroute fails, fallback to clearing the route.
      if (
        edge.occupied.length >= edge.capacity &&
        !edge.occupied.includes(entity.id)
      ) {
        if (route.distanceAlongEdge <= EPSILON) {
          const rerouted = attemptReroute(graph, route, entity.id, pathCache);
          if (rerouted) {
            graphDirty = true;
            continue;
          }
        }

        clearRoute(graph, vehicle, entity.id, "failed", () => {
          graphDirty = true;
        });
        break;
      }

      const edgeRemaining = edge.length - route.distanceAlongEdge;
      const travel = Math.min(distanceRemaining, edgeRemaining);
      route.distanceAlongEdge += travel;
      distanceRemaining -= travel;

      const startPosition = adjustPosition(fromNode.position);
      const endPosition = adjustPosition(toNode.position);
      const t = Math.min(route.distanceAlongEdge / edge.length, 1);
      const [x, y, z] = lerpPosition(startPosition, endPosition, t);

      transform.position[0] = x;
      transform.position[1] = y;
      transform.position[2] = z;

      const yaw = Math.atan2(
        endPosition[0] - startPosition[0],
        endPosition[2] - startPosition[2],
      );
      transform.rotation = [0, yaw, 0];

      if (edgeRemaining - travel <= EPSILON) {
        // Completed the edge
        route.currentEdgeIndex += 1;
        route.distanceAlongEdge = 0;
        route.currentNodeId = toNode.id;
        const removed = removeOccupancy(graph, edgeId!, entity.id);
        if (removed) {
          graphDirty = true;
        }

        // Snap to node to avoid drift
        alignTransformToNode(transform, toNode);
      }

      if (route.currentEdgeIndex >= route.path.edges.length) {
        clearRoute(graph, vehicle, entity.id, "arrived", () => {
          graphDirty = true;
        });
        break;
      }
    }
  }

  if (graphDirty) {
    networkStore.incrementVersion();
  }
}

export function resetVehiclePathCache() {
  pathCache.invalidate();
}
