import { beforeEach, describe, expect, it } from "vitest";
import { World } from "miniplex";
import type { Entity } from "@/game/ecs/world";
import {
  advanceVehicleSimulation,
  resetVehiclePathCache,
} from "@/game/ecs/systems/vehicleRoutes";
import type { Path } from "@/game/network/pathfinding";
import { useNetworkStore } from "@/game/state/slices/network";

const EDGE_AB = "edge-ab";
const EDGE_BA = "edge-ba";
const NODE_A = "node-a";
const NODE_B = "node-b";

function resetGraph() {
  const store = useNetworkStore.getState();
  store.graph.clear();
  useNetworkStore.setState({ visualEntities: {}, version: 0 });
}

function setupSimpleGraph() {
  const store = useNetworkStore.getState();

  store.addNode({
    id: NODE_A,
    position: [0, 0, 0],
    type: "station",
    connections: [],
  });

  store.addNode({
    id: NODE_B,
    position: [10, 0, 0],
    type: "station",
    connections: [],
  });

  const baseEdge = {
    trackType: "rail" as const,
    length: 10,
    speedLimit: 5,
    capacity: 2,
    occupied: [] as string[],
    visualEntityId: null,
  };

  store.addEdge({ id: EDGE_AB, fromNode: NODE_A, toNode: NODE_B, ...baseEdge });
  store.addEdge({ id: EDGE_BA, fromNode: NODE_B, toNode: NODE_A, ...baseEdge });
}

function createVehicle(world: World<Entity>, id: string) {
  const entity = world.add({
    id,
    Transform: { position: [0, 0.5, 0] },
    Renderable: { kind: "vehicle" },
    Vehicle: {
      speed: 0,
      accel: 2,
      maxSpeed: 6,
      type: "train",
      route: {
        state: "idle",
        currentNodeId: NODE_A,
        targetNodeId: null,
        path: null,
        currentEdgeIndex: 0,
        distanceAlongEdge: 0,
        dwellTimeRemaining: 0,
      },
    },
  });

  return entity;
}

beforeEach(() => {
  resetGraph();
  resetVehiclePathCache();
  setupSimpleGraph();
});

describe("advanceVehicleSimulation", () => {
  it("assigns a path and reserves edges for idle vehicles", () => {
    const world = new World<Entity>();
    const vehicle = createVehicle(world, "vehicle-1");

    advanceVehicleSimulation(world, 1 / 60);

    expect(vehicle.Vehicle?.route?.state).toBe("moving");
    const route = vehicle.Vehicle?.route;
    expect(route).toBeDefined();
    if (!route) {
      return;
    }

    expect(route.path).not.toBeNull();
    const path = route.path as Path | null;
    if (!path) {
      return;
    }

    // Assert that the path contains edges — cast to the Path type so the
    // TypeScript compiler recognizes the `edges` property in tests.
    expect(path.edges.length).toBeGreaterThan(0);

    const store = useNetworkStore.getState();
    const edge = store.graph.getEdge(EDGE_AB);
    expect(edge?.occupied).toContain("vehicle-1");
  });

  it("moves vehicles to the destination and clears occupancy", () => {
    const world = new World<Entity>();
    const vehicle = createVehicle(world, "vehicle-2");

    // Prime the route
    advanceVehicleSimulation(world, 1 / 60);

    for (let i = 0; i < 240; i += 1) {
      advanceVehicleSimulation(world, 1 / 60);
    }

    const route = vehicle.Vehicle?.route;
    expect(route?.state).toBe("waiting");
    expect(route?.path).toBeNull();
    expect(route?.currentNodeId).toBe(NODE_B);

    const store = useNetworkStore.getState();
    const edge = store.graph.getEdge(EDGE_AB);
    expect(edge?.occupied).not.toContain("vehicle-2");

    const position = vehicle.Transform?.position;
    expect(position?.[0]).toBeCloseTo(10, 1);
    expect(position?.[1]).toBeCloseTo(0.5, 1);
    expect(position?.[2]).toBeCloseTo(0, 1);
  });
});
