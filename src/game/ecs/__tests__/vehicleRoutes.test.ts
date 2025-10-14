import { beforeEach, describe, expect, it } from "vitest";
import { World } from "miniplex";
import type { Entity } from "@/game/ecs/world";
import {
  advanceVehicleSimulation,
  resetVehiclePathCache,
} from "@/game/ecs/systems/vehicleRoutes";
import { findPath, reservePath } from "@/game/network/pathfinding";
import { attemptReroute } from "@/game/ecs/systems/vehicleMotion";
import { useNetworkStore } from "@/game/state/slices/network";

type VehicleRoute = NonNullable<NonNullable<Entity["Vehicle"]>["route"]>;

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
  const initialRoute: VehicleRoute = {
    state: "idle",
    currentNodeId: NODE_A,
    targetNodeId: null,
    path: null,
    currentEdgeIndex: 0,
    distanceAlongEdge: 0,
    dwellTimeRemaining: 0,
    blockedEdgeId: null,
  };

  const entity = world.add({
    id,
    Transform: { position: [0, 0.5, 0] },
    Renderable: { kind: "vehicle" },
    Vehicle: {
      speed: 0,
      accel: 2,
      maxSpeed: 6,
      capacity: 80,
      type: "train",
      route: initialRoute,
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
    const path = route.path;
    if (!path) {
      return;
    }

    // Assert that the path contains edges to verify reservations were made.
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

  it("allows only one vehicle to reserve a capacity-1 edge and leaves the other waiting", () => {
    const world = new World<Entity>();

    // Reduce capacity to 1 so only a single vehicle can reserve the edge
    const store = useNetworkStore.getState();
    const e = store.graph.getEdge(EDGE_AB);
    if (e) e.capacity = 1;

    const v1 = createVehicle(world, "vehicle-1");
    const v2 = createVehicle(world, "vehicle-2");

    // First tick: attempt to assign routes
    advanceVehicleSimulation(world, 1 / 60);

    expect(v1.Vehicle?.route?.state).toBe("moving");
    expect(v2.Vehicle?.route?.state).toBe("idle");
    expect(v2.Vehicle?.route?.dwellTimeRemaining).toBeGreaterThan(0);

    const edge = store.graph.getEdge(EDGE_AB);
    expect(edge?.occupied).toContain("vehicle-1");
    expect(edge?.occupied).not.toContain("vehicle-2");
  });

  it("assigns the waiting vehicle after the first arrives and releases occupancy", () => {
    const world = new World<Entity>();

    // Force capacity to 1 so the second vehicle must wait
    const store = useNetworkStore.getState();
    const e = store.graph.getEdge(EDGE_AB);
    if (e) e.capacity = 1;

    const v1 = createVehicle(world, "vehicle-1");
    const v2 = createVehicle(world, "vehicle-2");

    // Prime the route assignment
    advanceVehicleSimulation(world, 1 / 60);

    // Advance simulation until v1 arrives (same strategy as existing test)
    for (let i = 0; i < 240; i += 1) {
      advanceVehicleSimulation(world, 1 / 60);
    }

    expect(v1.Vehicle?.route?.state).toBe("waiting");
    expect(v1.Vehicle?.route?.path).toBeNull();

    // Ensure occupancy freed
    const edgeAfter = store.graph.getEdge(EDGE_AB);
    expect(edgeAfter?.occupied).not.toContain("vehicle-1");

    // Run a few ticks to allow the waiting vehicle to be assigned (dwell/retry)
    for (let i = 0; i < 120; i += 1) {
      advanceVehicleSimulation(world, 1 / 60);
    }

    expect(v2.Vehicle?.route?.state).toBe("moving");
    const edgeFinal = store.graph.getEdge(EDGE_AB);
    expect(edgeFinal?.occupied).toContain("vehicle-2");
  });

  it("holds trailing vehicles at a signal until the block clears", () => {
    const world = new World<Entity>();
    const store = useNetworkStore.getState();

    const edge = store.graph.getEdge(EDGE_AB);
    if (edge) edge.capacity = 2;

    store.addSignal({
      id: "signal-edge-ab",
      edgeId: EDGE_AB,
      direction: "forward",
      position: [1, 1.8, 0],
      rotationY: 0,
      visualEntityId: null,
    });

    const v1 = createVehicle(world, "vehicle-1");
    const v2 = createVehicle(world, "vehicle-2");

    advanceVehicleSimulation(world, 1 / 60);

    expect(v1.Vehicle?.route?.state).toBe("moving");
    expect(v2.Vehicle?.route?.state).toBe("moving");

    for (let i = 0; i < 60; i += 1) {
      advanceVehicleSimulation(world, 1 / 60);
    }

    expect(v2.Vehicle?.route?.state).toBe("blocked");
    expect(v2.Vehicle?.route?.blockedEdgeId).toBe(EDGE_AB);

    for (let i = 0; i < 240; i += 1) {
      advanceVehicleSimulation(world, 1 / 60);
    }

    const route = v2.Vehicle?.route;
    expect(route).toBeDefined();
    if (!route) return;

    expect(route.state === "moving" || route.state === "waiting").toBe(true);
    expect(route.currentNodeId).toBe(NODE_B);
  });

  it("clears a vehicle's route and releases occupancy when an edge is removed mid-travel", () => {
    const world = new World<Entity>();
    const store = useNetworkStore.getState();

    const vehicle = createVehicle(world, "vehicle-edge-remove");

    // Prime the route so the vehicle reserves the edge
    advanceVehicleSimulation(world, 1 / 60);

    const route = vehicle.Vehicle?.route;
    expect(route?.state).toBe("moving");
    expect(route?.path).not.toBeNull();

    // Remove the edge from the graph to simulate demolition while moving
    // Remove both directions so the network becomes disconnected.
    store.graph.removeEdge(EDGE_AB);
    store.graph.removeEdge(EDGE_BA);

    // Advance simulation; the system should detect the missing edge and clear the route
    advanceVehicleSimulation(world, 1 / 60);

    const updatedRoute = vehicle.Vehicle?.route;
    expect(updatedRoute?.path).toBeNull();
    expect(updatedRoute?.state).toBe("idle");
  });

  it("reroutes when a blocked edge is removed and an alternate path exists", () => {
    const world = new World<Entity>();
    const store = useNetworkStore.getState();

    // Build a graph with a primary path A->B->C->D and an alternate A->E->D
    store.graph.clear();

    store.addNode({
      id: "A",
      position: [0, 0, 0],
      type: "station",
      connections: [],
    });
    store.addNode({
      id: "B",
      position: [10, 0, 0],
      type: "junction",
      connections: [],
    });
    store.addNode({
      id: "C",
      position: [20, 0, 0],
      type: "junction",
      connections: [],
    });
    store.addNode({
      id: "D",
      position: [30, 0, 0],
      type: "station",
      connections: [],
    });
    store.addNode({
      id: "E",
      position: [10, -10, 0],
      type: "junction",
      connections: [],
    });

    const baseEdge = (id: string, from: string, to: string) => ({
      id,
      fromNode: from,
      toNode: to,
      trackType: "rail" as const,
      length: 10,
      speedLimit: 5,
      capacity: 2,
      occupied: [] as string[],
      visualEntityId: null,
    });

    store.addEdge(baseEdge("AB", "A", "B"));
    store.addEdge(baseEdge("BC", "B", "C"));
    store.addEdge(baseEdge("CD", "C", "D"));
    store.addEdge(baseEdge("AE", "A", "E"));
    store.addEdge(baseEdge("ED", "E", "D"));

    // Create vehicle and prime route to D via primary path
    const vehicle = createVehicle(world, "reroute-vehicle");

    // Manually compute and assign the desired path so tests are deterministic
    const result = findPath(store.graph, "A", "D");
    expect(result.success).toBe(true);
    const path = result.path;
    if (!path) {
      throw new Error("Expected path to exist");
    }

    // Reserve the primary path for our vehicle and assign it to the route
    const reserved = reservePath(store.graph, path, "reroute-vehicle");
    expect(reserved).toBe(true);

    const vehicleComponent = vehicle.Vehicle;
    if (!vehicleComponent) {
      throw new Error("Vehicle component missing");
    }

    const reroute: VehicleRoute = {
      state: "moving",
      currentNodeId: "A",
      targetNodeId: "D",
      path,
      currentEdgeIndex: 0,
      distanceAlongEdge: 0,
      dwellTimeRemaining: 0,
    };
    vehicleComponent.route = reroute;

    // Advance until vehicle reaches node B
    let reachedB = false;
    for (let i = 0; i < 480; i++) {
      advanceVehicleSimulation(world, 1 / 60);
      const r = vehicle.Vehicle?.route;
      if (r?.currentNodeId === "B" && r.currentEdgeIndex === 1) {
        reachedB = true;
        break;
      }
    }

    expect(reachedB).toBe(true);

    // Simulate a blockage by removing edge BC (primary route). Since an
    // alternate A->E->D exists the vehicle should attempt to reroute.
    store.graph.removeEdge("BC");

    // Verify there is an alternate path available from the vehicle's
    // current node (B) to the target (D) before running the reroute step.
    const verifyAlt = findPath(store.graph, "B", "D");
    expect(verifyAlt.success).toBe(true);

    // Attempt reroute directly (verify helper works) and then allow one
    // simulation tick to let the system settle. This also makes the test
    // deterministic and decouples it from internal scheduling.
    const activeRoute = vehicleComponent.route;
    if (!activeRoute) {
      throw new Error("Route missing after assignment");
    }

    const manual = attemptReroute(store.graph, activeRoute, "reroute-vehicle");
    expect(manual).toBe(true);

    // The route should now be updated to the alternate path
    const newRoute = vehicleComponent.route;
    if (!newRoute) {
      throw new Error("Route missing after reroute");
    }
    expect(newRoute.path).not.toBeNull();
    // Expect edges to be the alternate route (may contain the reverse of AB
    // from B -> A followed by AE -> ED).
    expect(newRoute.path?.edges).toEqual(["AB", "AE", "ED"]);
    expect(newRoute.state).toBe("moving");

    // Run one tick so the system has a chance to continue motion
    advanceVehicleSimulation(world, 1 / 60);
  });

  it("handles multiple vehicles competing for a capacity-limited edge", () => {
    const world = new World<Entity>();
    const store = useNetworkStore.getState();

    // Simple A <-> B graph with capacity 2 so only two vehicles can reserve
    store.graph.clear();
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

    store.addEdge({
      id: EDGE_AB,
      fromNode: NODE_A,
      toNode: NODE_B,
      ...baseEdge,
    });
    store.addEdge({
      id: EDGE_BA,
      fromNode: NODE_B,
      toNode: NODE_A,
      ...baseEdge,
    });

    createVehicle(world, "v1");
    createVehicle(world, "v2");
    const v3 = createVehicle(world, "v3");

    // First tick: attempt to assign routes for all vehicles
    advanceVehicleSimulation(world, 1 / 60);

    const edge = store.graph.getEdge(EDGE_AB);
    expect(edge).toBeDefined();
    expect(edge?.occupied.length).toBe(2);
    expect(edge?.occupied).toContain("v1");
    expect(edge?.occupied).toContain("v2");

    // Third vehicle should be idle and waiting to retry
    expect(v3.Vehicle?.route?.state).toBe("idle");
    expect(v3.Vehicle?.route?.dwellTimeRemaining).toBeGreaterThan(0);

    // Advance until v1 arrives and frees capacity, then v3 should be assigned
    for (let i = 0; i < 480; i++) {
      advanceVehicleSimulation(world, 1 / 60);
    }

    // By now v1 should have arrived and released occupancy for AB
    const afterEdge = store.graph.getEdge(EDGE_AB);
    expect(afterEdge?.occupied?.includes("v1")).toBe(false);

    // Run several ticks to allow v3 to be assigned — wait until the edge
    // occupancy includes v3 or we time out.
    let assignedV3 = false;
    for (let i = 0; i < 240; i++) {
      advanceVehicleSimulation(world, 1 / 60);
      const occ = store.graph.getEdge(EDGE_AB);
      if (occ?.occupied?.includes("v3")) {
        assignedV3 = true;
        break;
      }
    }

    expect(assignedV3).toBe(true);
  });
});
