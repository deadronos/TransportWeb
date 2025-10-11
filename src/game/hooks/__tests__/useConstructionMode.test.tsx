import { describe, expect, it, beforeEach, vi } from "vitest";
import { Vector3 } from "three";

import {
  determinePlacementValidity,
  executePlacement,
  executeDemolition,
  isNeighborCompatible,
  type ToolConfig,
} from "../useConstructionMode";
import { useNetworkStore } from "../../state/slices/network";
import type { Entity } from "../../ecs/world";
import { calculateDistance } from "../../network/utils";

const worldAddMock = vi.fn((entity: Entity) => entity);
const worldRemoveMock = vi.fn();

vi.mock("../../ecs/world", () => ({
  useWorld: () => ({
    add: worldAddMock,
    remove: worldRemoveMock,
  }),
}));

let idQueue: string[] = [];
vi.mock("nanoid", () => ({
  nanoid: () => {
    if (idQueue.length === 0) {
      throw new Error("nanoid queue exhausted");
    }
    return idQueue.shift()!;
  },
}));

describe("useConstructionMode helpers", () => {
  beforeEach(() => {
    worldAddMock.mockClear();
    worldRemoveMock.mockClear();
    idQueue = ["new-node", "segment-visual", "edge-forward", "edge-backward"];

    const store = useNetworkStore.getState();
    for (const node of store.graph.getAllNodes()) {
      store.removeNode(node.id);
    }
    useNetworkStore.setState({ visualEntities: {}, version: 0 });
  });

  it("determines placement validity based on existing node", () => {
    expect(determinePlacementValidity("rail", null)).toBe(true);
    expect(
      determinePlacementValidity("rail", {
        id: "x",
        position: [0, 0, 0],
        type: "junction",
        connections: [],
      }),
    ).toBe(false);
    expect(determinePlacementValidity("demolish", null)).toBe(false);
  });

  it("connects neighbors and registers visuals when executing placement", () => {
    const store = useNetworkStore.getState();
    store.addNode({
      id: "existing-node",
      position: [10, 0, 0],
      type: "junction",
      connections: [],
      metadata: { trackType: "rail" },
    });

    const connectNeighbors = (
      nodeId: string,
      nodePosition: [number, number, number],
      config: ToolConfig,
    ) => {
      const neighbors = store.graph
        .getAllNodes()
        .filter(
          (candidate) =>
            candidate.id !== nodeId &&
            isNeighborCompatible(candidate, nodePosition, config.trackType),
        );

      for (const neighbor of neighbors) {
        if (store.graph.getEdgesBetweenNodes(nodeId, neighbor.id).length > 0) {
          continue;
        }

        const length = calculateDistance(nodePosition, neighbor.position);
        const entityId = idQueue.shift()!;
        const midpoint: [number, number, number] = [
          (nodePosition[0] + neighbor.position[0]) / 2,
          nodePosition[1] + config.segment.thickness / 2,
          (nodePosition[2] + neighbor.position[2]) / 2,
        ];
        const alongZ =
          Math.abs(neighbor.position[2] - nodePosition[2]) >
          Math.abs(neighbor.position[0] - nodePosition[0]);
        const rotationY = alongZ ? Math.PI / 2 : 0;

        const entity = worldAddMock({
          id: entityId,
          Transform: {
            position: midpoint,
            rotation: [0, rotationY, 0],
          },
          Renderable: {
            kind: config.segment.renderKind,
            dimensions: [
              length,
              config.segment.thickness,
              config.segment.width,
            ],
          },
        });

        store.registerVisualEntity(entityId, entity);

        const edgeBase = {
          trackType: config.trackType,
          length,
          speedLimit: config.segment.speedLimit,
          capacity: config.segment.capacity,
          occupied: [] as string[],
          visualEntityId: entityId,
        };

        store.addEdge({
          id: idQueue.shift()!,
          fromNode: nodeId,
          toNode: neighbor.id,
          ...edgeBase,
        });
        store.addEdge({
          id: idQueue.shift()!,
          fromNode: neighbor.id,
          toNode: nodeId,
          ...edgeBase,
        });
      }
    };

    executePlacement("rail", new Vector3(0, 0, 0), {
      world: { add: worldAddMock, remove: worldRemoveMock },
      registerVisualEntity: store.registerVisualEntity,
      addNode: store.addNode,
      connectNeighbors,
    });

    const nodes = store.graph.getAllNodes();
    expect(nodes).toHaveLength(2);
    const newNode = nodes.find((node) => node.id === "new-node");
    expect(newNode?.metadata?.trackType).toBe("rail");

    const edges = store.graph.getEdgesBetweenNodes("new-node", "existing-node");
    expect(edges).toHaveLength(2);
    expect(edges[0]?.visualEntityId).toBe("segment-visual");
    expect(edges[1]?.visualEntityId).toBe("segment-visual");

    expect(worldAddMock).toHaveBeenCalledTimes(1);
    const renderable = worldAddMock.mock.calls[0]?.[0]?.Renderable;
    expect(renderable?.dimensions?.[0]).toBeCloseTo(10);
    expect(store.getVisualEntity("segment-visual")).toBeDefined();
  });

  it("returns false when attempting demolition without a node", () => {
    const store = useNetworkStore.getState();

    const result = executeDemolition(new Vector3(100, 0, 0), {
      graph: store.graph,
      findNodeAtPosition: store.findNodeAtPosition,
      unregisterVisualEntity: store.unregisterVisualEntity,
      removeNode: store.removeNode,
      world: { add: worldAddMock, remove: worldRemoveMock },
    });

    expect(result).toBe(false);
    expect(worldRemoveMock).not.toHaveBeenCalled();
  });

  it("removes node, edges, and visuals when executing demolition", () => {
    const store = useNetworkStore.getState();

    const segmentEntity: Entity = { id: "segment-visual" };
    const buildingEntity: Entity = { id: "building-visual" };

    store.addNode({
      id: "node-a",
      position: [0, 0, 0],
      type: "junction",
      connections: [],
      metadata: { trackType: "rail", visualEntityId: "building-visual" },
    });
    store.addNode({
      id: "node-b",
      position: [10, 0, 0],
      type: "junction",
      connections: [],
      metadata: { trackType: "rail" },
    });

    store.addEdge({
      id: "edge-forward",
      fromNode: "node-a",
      toNode: "node-b",
      trackType: "rail",
      length: 10,
      speedLimit: 40,
      capacity: 1,
      occupied: [],
      visualEntityId: "segment-visual",
    });
    store.addEdge({
      id: "edge-backward",
      fromNode: "node-b",
      toNode: "node-a",
      trackType: "rail",
      length: 10,
      speedLimit: 40,
      capacity: 1,
      occupied: [],
      visualEntityId: "segment-visual",
    });

    store.registerVisualEntity("segment-visual", segmentEntity);
    store.registerVisualEntity("building-visual", buildingEntity);

    const result = executeDemolition(new Vector3(0, 0, 0), {
      graph: store.graph,
      findNodeAtPosition: store.findNodeAtPosition,
      unregisterVisualEntity: store.unregisterVisualEntity,
      removeNode: store.removeNode,
      world: { add: worldAddMock, remove: worldRemoveMock },
    });

    expect(result).toBe(true);
    expect(store.graph.getNode("node-a")).toBeUndefined();
    expect(store.graph.getEdgesBetweenNodes("node-a", "node-b")).toHaveLength(
      0,
    );
    expect(store.getVisualEntity("segment-visual")).toBeUndefined();
    expect(store.getVisualEntity("building-visual")).toBeUndefined();
    expect(worldRemoveMock).toHaveBeenCalledTimes(2);
    expect(worldRemoveMock).toHaveBeenCalledWith(segmentEntity);
    expect(worldRemoveMock).toHaveBeenCalledWith(buildingEntity);
  });
});
